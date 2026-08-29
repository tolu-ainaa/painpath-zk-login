import { db } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";
import admin from "firebase-admin";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    const { exercisePlan } = body;

    if (!exercisePlan) {
      return NextResponse.json({ error: "Missing plan" }, { status: 400 });
    }

    const docRef = db.collection("sessions").doc(id);

    await docRef.update({
      "plan.final": exercisePlan,
      "plan.edited": true,
      "audit.updatedAt": admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ message: "Plan updated" });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}