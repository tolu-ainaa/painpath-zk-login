import { NextResponse } from "next/server";
import { listSessions } from "@/lib/store/sessions";

// The POST ingest endpoint that received pain JSON from the Quest 3 headset,
// ran it through Gemini and wrote it to Firestore was removed when the portal
// was rebuilt for the Midnight hackathon. Sessions are now read-only fixtures.

export async function GET() {
  const sessions = listSessions().map((session) => ({
    sessionId: session.sessionId,
    patientId: session.patientId,
    status: session.status,
    submittedAt: session.submittedAt,
    dominantPainType: session.rawInput.sessionSummary?.dominantPainType ?? null,
    maxIntensity: session.rawInput.sessionSummary?.maxIntensity ?? null,
  }));

  return NextResponse.json(sessions, { status: 200 });
}
