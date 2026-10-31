import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";

export async function POST() {
  // 1. Check logged-in user
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // 2. If user is not logged in
  if (!session) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // 3. Create new conversation
  const conversation = await db.conversation.create({
    data: {
      userId: session.user.id,
      title: "New Conversation",
    },
  });

  // 4. Return created conversation
  return Response.json(conversation);
}