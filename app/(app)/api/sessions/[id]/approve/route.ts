import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import admin from "firebase-admin";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const docRef = db.collection("sessions").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const data = doc.data();
    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // ⚠️ Decide which plan to approve
    const finalPlan = data.plan?.edited
      ? data.plan.final
      : data.plan.ai;

    await docRef.update({
      status: "approved",
      "plan.final": finalPlan,
      "plan.approvedAt": admin.firestore.FieldValue.serverTimestamp(),
      "plan.approvedBy": "physio_001", // replace later with auth
      "audit.updatedAt": admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ message: "Approved" });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}