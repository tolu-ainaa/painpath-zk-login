import { NextResponse } from "next/server";
import { getSession } from "@/lib/store/sessions";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: "Missing session ID" }, { status: 400 });
  }

  const session = getSession(id);

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json(session, { status: 200 });
}
