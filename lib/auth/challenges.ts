// Login challenges and the sessions they open.
//
// How the check actually works
// ---------------------------
// The portal cannot compute a nullifier — it does not know anyone's secret.
// So it does not try to. Instead:
//
//   1. It issues a fresh random 32-byte challenge and records which nullifiers
//      were already spent at that moment.
//   2. The clinician authenticates with that challenge on their own device.
//   3. The portal watches the ledger. If a nullifier appears that was not in
//      the snapshot, someone produced a valid proof.
//
// That has teeth, because `authenticate` asserts the caller's commitment is in
// the registered set. Anyone without a registered secret cannot make the
// nullifier set grow, whatever they send the portal.
//
// Known limitation, stated rather than hidden: with two logins in flight at
// once the portal could attribute the wrong nullifier to a session. Fixing it
// properly means recording challenge -> nullifier in the contract itself.

import { randomBytes, randomUUID } from "node:crypto";

const CHALLENGE_TTL_MS = 5 * 60 * 1000; // 5 minutes to complete a login
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // a clinical shift

export type Challenge = {
  id: string;
  challengeHex: string;
  nullifiersAtIssue: string[];
  issuedAt: number;
  expiresAt: number;
};

export type PortalSession = {
  id: string;
  nullifier: string;
  openedAt: number;
  expiresAt: number;
};

type Store = {
  challenges: Map<string, Challenge>;
  sessions: Map<string, PortalSession>;
};

// Survives dev-server module reloads.
const g = globalThis as unknown as { __painPathAuth?: Store };

function store(): Store {
  if (!g.__painPathAuth) {
    g.__painPathAuth = { challenges: new Map(), sessions: new Map() };
  }
  return g.__painPathAuth;
}

function sweep(): void {
  const now = Date.now();
  const s = store();
  for (const [k, v] of s.challenges) if (v.expiresAt < now) s.challenges.delete(k);
  for (const [k, v] of s.sessions) if (v.expiresAt < now) s.sessions.delete(k);
}

export function issueChallenge(nullifiersNow: string[]): Challenge {
  sweep();
  const now = Date.now();
  const challenge: Challenge = {
    id: randomUUID(),
    challengeHex: randomBytes(32).toString("hex"),
    nullifiersAtIssue: [...nullifiersNow],
    issuedAt: now,
    expiresAt: now + CHALLENGE_TTL_MS,
  };
  store().challenges.set(challenge.id, challenge);
  return challenge;
}

export function getChallenge(id: string): Challenge | undefined {
  sweep();
  return store().challenges.get(id);
}

/**
 * Given the nullifiers currently on chain, returns any that appeared after the
 * challenge was issued.
 */
export function newNullifiersSince(
  challenge: Challenge,
  nullifiersNow: string[],
): string[] {
  const before = new Set(challenge.nullifiersAtIssue);
  return nullifiersNow.filter((n) => !before.has(n));
}

export function openSession(nullifier: string): PortalSession {
  const now = Date.now();
  const session: PortalSession = {
    id: randomUUID(),
    nullifier,
    openedAt: now,
    expiresAt: now + SESSION_TTL_MS,
  };
  store().sessions.set(session.id, session);
  return session;
}

export function getSession(id: string | undefined): PortalSession | undefined {
  if (!id) return undefined;
  sweep();
  return store().sessions.get(id);
}

export function closeSession(id: string | undefined): void {
  if (id) store().sessions.delete(id);
}

export function consumeChallenge(id: string): void {
  store().challenges.delete(id);
}

/** For the verifier panel: how many sessions are open, and on what. */
export function sessionSummary(): { open: number; nullifiers: string[] } {
  sweep();
  const sessions = [...store().sessions.values()];
  return { open: sessions.length, nullifiers: sessions.map((s) => s.nullifier) };
}
