import { Session } from "@/types";
import { listSessions } from "@/lib/store/sessions";

// Server components read the store directly — there is no external database
// and no NEXT_PUBLIC_API_BASE_URL round trip to make. The /api/sessions route
// still exists for client-side calls and for inspecting the store in the demo.
export async function fetchSessions(): Promise<Session[]> {
  return listSessions();
}
