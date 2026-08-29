import Navbar from "@/components/Navbar";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "@/lib/auth/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // PLACEHOLDER — presence check only. Phase 4 replaces this with a check that
  // the session was opened by a verified proof. See lib/auth/session.ts.
  const sessionCookie = (await cookies()).get(SESSION_COOKIE)?.value;

  if (!sessionCookie) {
    redirect("/login");
  }

  return (
    <div className="min-h-full flex flex-col p-4">
      <Navbar />
      {children}
    </div>
  );
}
