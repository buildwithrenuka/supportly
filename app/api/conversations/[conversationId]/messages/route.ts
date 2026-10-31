
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { MessageRole } from "@/app/generated/prisma/client";

type RouteContext = {
  params: Promise<{
    conversationId: string;
  }>;
};

// POST: Save a new message
export async function POST(
  request: Request,
  { params }: RouteContext
) {
  const { conversationId } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = await request.json();
  const content = body.content;

  if (
    !content ||
    typeof content !== "string" ||
    !content.trim()
  ) {
    return Response.json(
      { error: "Message content is required" },
      { status: 400 }
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
      { status: 404 }
    );
  }

  const message = await db.message.create({
    data: {
      content: content.trim(),
      role: MessageRole.user,
      conversationId: conversationId,
    },
  });

  return Response.json(message, { status: 201 });
}

// GET: Fetch messages from a conversation
export async function GET(
  request: Request,
  { params }: RouteContext
) {
  const { conversationId } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401 }
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
      { status: 404 }
    );
  }

  const messages = await db.message.findMany({
    where: {
      conversationId: conversationId,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return Response.json(messages);
}
