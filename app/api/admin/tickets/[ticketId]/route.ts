import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { TicketStatus } from "@/app/generated/prisma/client";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    // 1. Check login
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Verify admin role
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // 3. Get ticket ID and new status
    const { ticketId } = await params;
    const body = await request.json();
    const { status } = body;

    const allowedStatuses = Object.values(TicketStatus);

    if (
      typeof status !== "string" ||
      !allowedStatuses.includes(status as TicketStatus)
    ) {
      return NextResponse.json(
        { error: "Invalid ticket status" },
        { status: 400 }
      );
    }

    // 4. Update ticket
    const ticket = await db.ticket.update({
      where: { id: ticketId },
      data: { status: status as TicketStatus },
    });

    return NextResponse.json(ticket);

  } catch (error) {
    console.error("Update ticket error:", error);

    return NextResponse.json(
      { error: "Failed to update ticket" },
      { status: 500 }
    );
  }
}