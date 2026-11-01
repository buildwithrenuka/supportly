import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    // 1. Check logged-in user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { conversationId } = await params;

    // 2. Verify conversation ownership
    const conversation = await db.conversation.findFirst({
      where: {
        id: conversationId,
        userId: session.user.id,
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // 3. Read ticket details
    const body = await request.json();
    const { subject, description } = body;

    if (
      typeof subject !== "string" ||
      !subject.trim() ||
      typeof description !== "string" ||
      !description.trim()
    ) {
      return NextResponse.json(
        { error: "Subject and description are required" },
        { status: 400 }
      );
    }

    // 4. Create support ticket
    const ticket = await db.ticket.create({
      data: {
        subject: subject.trim(),
        description: description.trim(),
        userId: session.user.id,
        conversationId,
      },
    });

    return NextResponse.json(ticket, { status: 201 });

  } catch (error) {
    console.error("Create ticket error:", error);

    return NextResponse.json(
      { error: "Failed to create ticket" },
      { status: 500 }
    );
  }
}