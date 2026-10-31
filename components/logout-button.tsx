"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/sign-in");
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className="rounded bg-black px-4 py-2 text-white"
    >
      Logout
    </button>
  );
}