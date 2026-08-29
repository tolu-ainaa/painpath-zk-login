import Navbar from "@/components/Navbar";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/firebaseAdmin";


export default async function LayoutPublic({
  children,
}: {
  children: React.ReactNode;
}) {

  const sessionCookie = (await cookies()).get("session")?.value;

  if (!sessionCookie) {
    redirect("/login");
  }

  try {
    await auth.verifySessionCookie(sessionCookie, true); // true = check revocation
  } catch {
    redirect("/login");
  }

  return (
    <div className="min-h-full flex flex-col p-4">
          <Navbar/>
          {children}
      </div>
  );
}
