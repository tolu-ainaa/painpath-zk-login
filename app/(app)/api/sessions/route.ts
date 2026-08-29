import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import admin from "firebase-admin";
import { processPainZones } from "@/lib/mapToRegion";
import { analyzePain } from "@/lib/ai/analyzePain";
import { buildPainSummary } from "@/lib/ai/buildPainSummary";
import { PainSummary } from "@/types";

export const maxDuration = 30; // give Claude time to respond

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 🔴 1. Basic validation (don’t skip this)
    if (!body.sessionId || !body.patientId || !body.painZones) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const processedRegions = processPainZones(body.painZones);

const painSummary = buildPainSummary(
  processedRegions,
  body.sessionSummary,
  body.regionDetails ?? [] // ← add this
);

    let aiAnalysis = null;

    try {
      aiAnalysis = await analyzePain(painSummary as PainSummary);
    } catch (err) {
      console.error("AI failed", err);
    }

    // const aiAnalysis = await analyzePain(painSummary);

    // 🔴 2. Structure data properly (don’t store raw at root)
    const sessionData = {
      sessionId: body.sessionId,
      patientId: body.patientId,
      deviceType: body.deviceType || "unknown",
      //   submittedAt: body.submittedAt || new Date().toISOString(),
      submittedAt: admin.firestore.Timestamp.fromDate(
        body.submittedAt ? new Date(body.submittedAt) : new Date(),
      ),

      status: "pending_review",
      // approvedAt: null,

      rawInput: {
        painZones: body.painZones,
        sessionSummary: body.sessionSummary || null,
      },

      processed: {
        regions: processedRegions,
        painSummary,
      }, // will be added later
      aiAnalysis, // will be added later
      // exercisePlan: aiAnalysis?.exercisePlan || null, // physio will approve later
      plan: {
  ai: aiAnalysis?.exercisePlan || null,   // original AI output
  final: null,                           // physio-approved or edited version
  edited: false,
  approvedBy: null,
  approvedAt: null,
},

      // audit: {
      //   createdAt: new Date().toISOString(),
      //   updatedAt: new Date().toISOString(),
      // },
       audit: {
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  },
    };

    // 🔴 3. Save to Firestore
    await db.collection("sessions").doc(body.sessionId).set(sessionData);

    return NextResponse.json(
      { message: "Session created successfully" },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/sessions error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const snapshot = await db.collection("sessions").get();

    const sessions = snapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        sessionId: doc.id,
        patientId: data.patientId,
        status: data.status,
        submittedAt: data.submittedAt,
        dominantPainType:
          data.rawInput?.sessionSummary?.dominantPainType || null,
        maxIntensity: data.rawInput?.sessionSummary?.maxIntensity || null,
      };
    });

    return NextResponse.json(sessions, { status: 200 });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 },
    );
  }
}
