import Navbar from "@/components/Navbar";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { getSession } from "@/lib/auth/challenges";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  /*
   * A real check, not a presence check. The cookie carries an opaque session
   * id; the session only exists because /api/auth/verify saw a nullifier
   * appear on the ledger after it issued a challenge. Forging the cookie value
   * gets you nothing — there is no matching session server-side.
   */
  const sessionId = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = getSession(sessionId);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-full flex flex-col p-4">
      <Navbar />
      {children}
    </div>
  );
}
