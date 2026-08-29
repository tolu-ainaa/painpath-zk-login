import { Session } from "@/types";

export async function fetchSessions(): Promise<Session[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/sessions`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch sessions: ${res.status}`);
  }

  const data = await res.json();

  // Optional: basic sanity check
  if (!Array.isArray(data)) {
    throw new Error("Invalid response format");
  }

  return data;
}