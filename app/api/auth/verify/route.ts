import { NextResponse } from "next/server";
import { readLedger } from "@/lib/midnight/ledger";
import {
  consumeChallenge,
  getChallenge,
  newNullifiersSince,
  openSession,
} from "@/lib/auth/challenges";
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/lib/auth/session";

/*
 * Step 2 of the login: has a proof landed?
 *
 * The portal reads the ledger and looks for a nullifier that was not present
 * when it issued the challenge. Only a valid `authenticate` proof can put one
 * there, and the circuit only accepts proofs whose commitment is in the
 * registered set — so a caller without a credential cannot make this succeed,
 * regardless of what they send here.
 */
export async function POST(req: Request) {
  const { challengeId } = (await req.json()) as { challengeId?: string };

  const challenge = challengeId ? getChallenge(challengeId) : undefined;
  if (!challenge) {
    return NextResponse.json(
      { status: "expired", message: "Challenge expired or unknown. Start again." },
      { status: 410 },
    );
  }

  const ledger = await readLedger();
  if (!ledger) {
    return NextResponse.json(
      { status: "unavailable", message: "Cannot read the ledger." },
      { status: 503 },
    );
  }

  const fresh = newNullifiersSince(challenge, ledger.nullifiers);

  if (fresh.length === 0) {
    return NextResponse.json(
      {
        status: "waiting",
        message: "No proof has landed yet.",
        nullifiersAtIssue: challenge.nullifiersAtIssue.length,
        nullifiersNow: ledger.nullifiers.length,
      },
      { status: 200, headers: { "cache-control": "no-store" } },
    );
  }

  // A proof landed. Open a session bound to the nullifier that opened it.
  const nullifier = fresh[0];
  const session = openSession(nullifier);
  consumeChallenge(challenge.id);

  const response = NextResponse.json(
    {
      status: "authenticated",
      nullifier,
      message:
        "A nullifier appeared that was not on the ledger when this challenge was issued. Only a proof against a registered credential can do that.",
    },
    { status: 200, headers: { "cache-control": "no-store" } },
  );

  response.cookies.set(SESSION_COOKIE, session.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });

  return response;
}
