import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
export const instant = false;

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Welcome to Supportly!</h1>

        <p className="mt-2 text-gray-500">Your customer support dashboard.</p>
        <div className="mt-4">
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
