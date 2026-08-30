import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { closeSession } from "@/lib/auth/challenges";

export async function POST() {
  const sessionId = (await cookies()).get(SESSION_COOKIE)?.value;
  closeSession(sessionId);

  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE, "", { maxAge: 0, path: "/" });
  return response;
}
