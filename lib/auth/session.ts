// lib/auth/session.ts
//
// PLACEHOLDER AUTH — deliberately not a security boundary.
//
// The original portal authenticated clinicians with Firebase Auth
// (email + password) and minted a Firebase session cookie. That was removed
// so nothing about a clinician's credentials is stored server-side.
//
// It is replaced in Phase 4 by the Midnight flow: the browser proves knowledge
// of a locally held secret, the contract records a nullifier, and the session
// is opened only once that nullifier lands on the ledger. Until then this file
// is a stub that gates on the presence of a cookie and nothing more — do not
// deploy it anywhere real.

export const SESSION_COOKIE = "session";

// 8 hours — a clinical shift.
export const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;
