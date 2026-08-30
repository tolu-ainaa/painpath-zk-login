import { NextResponse } from "next/server";
import { readLedger } from "@/lib/midnight/ledger";
import { issueChallenge } from "@/lib/auth/challenges";

/*
 * Step 1 of the login: the portal issues a fresh random challenge and records
 * which nullifiers were already spent. The clinician then authenticates with
 * this challenge on their own device.
 */
export async function POST() {
  const ledger = await readLedger();

  if (!ledger) {
    return NextResponse.json(
      {
        error: "no-contract",
        message:
          "No contract is deployed, or the local Midnight stack is not running. Deploy one with the clinician agent first.",
      },
      { status: 503 },
    );
  }

  const challenge = issueChallenge(ledger.nullifiers);

  return NextResponse.json(
    {
      challengeId: challenge.id,
      challenge: challenge.challengeHex,
      contractAddress: ledger.contractAddress,
      registeredCredentials: ledger.commitments.length,
      nullifiersAtIssue: ledger.nullifiers.length,
      expiresInSeconds: Math.round((challenge.expiresAt - Date.now()) / 1000),
    },
    { status: 200, headers: { "cache-control": "no-store" } },
  );
}
