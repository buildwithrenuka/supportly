import { run, InputGuardrailTripwireTriggered, OutputGuardrailTripwireTriggered, } from "@openai/agents";
import { supportlyAgent } from "@/lib/agents/supportly-agent";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { MessageRole } from "@/app/generated/prisma/client";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const conversationId = body.conversationId;

    if (typeof conversationId !== "string" || !conversationId) {
      return Response.json(
        { error: "Conversation ID is required" },
        { status: 400 },
      );
    }

    const conversation = await db.conversation.findFirst({
      where: {
        id: conversationId,
        userId: session.user.id,
      },
    });

    if (!conversation) {
      return Response.json(
        { error: "Conversation not found" },
        { status: 404 },
      );
    }

    const messages = await db.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });

    const input = messages
      .map((message) => `${message.role}: ${message.content}`)
      .join("\n");

    const result = await run(supportlyAgent, input, { stream: true });

    const textStream = result.toTextStream({
      compatibleWithNodeStreams: true,
    });

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
  async start(controller) {
    let fullResponse = "";

    try {
      // Collect response chunks, but don't send them yet.
      for await (const chunk of textStream) {
        fullResponse += String(chunk);
      }

      // Wait for all guardrails to complete.
      await result.completed;

      console.log("Final Agent:", result.lastAgent?.name);

      if (fullResponse.trim()) {
        await db.message.create({
          data: {
            content: fullResponse,
            role: MessageRole.assistant,
            conversationId,
          },
        });
      }

      // Send response only after guardrail approval.
      controller.enqueue(encoder.encode(fullResponse));
      controller.close();

    } catch (error) {
      let safeMessage: string;

      if (error instanceof InputGuardrailTripwireTriggered) {
        safeMessage =
          "I'm sorry, but I can't help with that request. Please ask a customer support question.";

      } else if (error instanceof OutputGuardrailTripwireTriggered) {
        safeMessage =
          "I'm sorry, but I can't provide that response. Please ask another support question.";

      } else {
        console.error("Streaming error:", error);
        controller.error(error);
        return;
      }

      await db.message.create({
        data: {
          content: safeMessage,
          role: MessageRole.assistant,
          conversationId,
        },
      });

      controller.enqueue(encoder.encode(safeMessage));
      controller.close();
    }
  },
});
    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  } catch (error) {
    console.error("AI Chat Error:", error);

    return Response.json(
      { error: "Failed to process AI request" },
      { status: 500 },
    );
  }
}
