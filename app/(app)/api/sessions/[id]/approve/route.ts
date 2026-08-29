import { NextResponse } from "next/server";
import { approveSession } from "@/lib/store/sessions";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  const updated = approveSession(id);

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ message: "Approved" });
}
