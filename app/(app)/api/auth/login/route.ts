import { NextResponse } from "next/server";
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/lib/auth/session";

// PLACEHOLDER — see lib/auth/session.ts.
//
// This route previously verified a Firebase ID token and exchanged it for a
// Firebase session cookie. It now opens a session unconditionally, because the
// real check is being rebuilt as a zero-knowledge proof against the Midnight
// contract in Phase 4. Nothing here authenticates anybody.
export async function POST() {
  const response = NextResponse.json({ success: true });

  response.cookies.set(SESSION_COOKIE, "placeholder-pending-zk-login", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });

  return response;
}
