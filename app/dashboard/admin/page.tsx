import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AdminTickets from "@/components/admin-tickets";

export const instant = false;

export default async function AdminPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen p-8">
      <h1 className="mb-2 text-3xl font-bold">
        Admin Dashboard
      </h1>
      <p className="mb-8 text-gray-500">
        Manage customer support tickets.
      </p>

      <AdminTickets />
    </main>
  );
}