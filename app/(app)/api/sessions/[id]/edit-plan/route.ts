import { NextResponse } from "next/server";
import { editPlan } from "@/lib/store/sessions";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const body = await req.json();

  const { exercisePlan } = body;

  if (!exercisePlan) {
    return NextResponse.json({ error: "Missing plan" }, { status: 400 });
  }

  const updated = editPlan(id, exercisePlan);

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ message: "Plan updated" });
}
