# PainPath ZK Login

**Midnight Hackathon — Integrate Midnight to Upgrade an Existing App**

Replacing the password login on an existing clinical portal with a
zero-knowledge credential check, so the server holds nothing worth stealing.

> ⚠️ Proof of concept. Not a security product, not for clinical use.
> See [Honest caveats](#honest-caveats).

---

## What existed before this weekend

Everything below predates the hackathon and is **prior work**:

- **PainPath Physio Portal** — this Next.js app. Clinician dashboard for
  reviewing AR pain-assessment sessions: patient list, pain heatmap, AI-generated
  exercise plans, inline plan editing, and one-click approval.
- **PainPath Unity app** — a Meta Quest 3 experience where a patient paints their
  pain onto a body model. Lives in a separate repository; not part of this one.
- **The Firestore schema** — session documents, pain zones, exercise plans,
  approval audit trail.
- **The AI assessment layer** — pain data structured into a prompt, sent to
  Gemini, returned as a condition match plus an exercise plan.

The exact pre-hackathon state is preserved at the tag
[`baseline-firebase-auth`](../../releases/tag/baseline-firebase-auth) — the first
commit in this repository, committed untouched so the hackathon work reads as a
clean diff:

```bash
git checkout baseline-firebase-auth
```

## What is being built this weekend

Only the authentication layer.

The old flow: a clinician typed an email and password, Firebase Auth checked
them against a credential store, and the server minted a session cookie. That
credential store is a target. A chronic pain diary is not a low-stakes dataset —
a breach tells an attacker who is in pain, where, and how badly.

The new flow, built on **Midnight**:

1. The browser generates a 256-bit secret and keeps it in encrypted private
   state. It never leaves the device.
2. A Compact circuit hashes the secret with a domain-separated prefix and
   publishes **only the commitment** to the ledger.
3. To log in, the browser proves it knows a secret matching a commitment in the
   set, and emits a nullifier so the same proof cannot be replayed.
4. The server checks the ledger, sees the nullifier, and opens a session.

The server never sees the secret, never stores a hash of it, and has no
credential table to leak.

## Current state

Phase 1 of the build: the portal has been stripped back to something that holds
no secrets and depends on no external services, ready for the Midnight
integration to land.

| Area | State |
|---|---|
| Portal UI, heatmap, plan editing, approval | Working |
| Session data | In-memory, seeded from `data/sessions.seed.json` |
| Firestore | Removed |
| Firebase Auth | Removed |
| Quest 3 pain-logging ingest endpoint | Removed |
| Gemini analysis calls | Removed — fixtures carry pre-computed `aiAnalysis` |
| Login | **Placeholder.** `/login` opens a session with no check at all |

The placeholder login is loudly marked as such in
[`lib/auth/session.ts`](lib/auth/session.ts). It is a stub standing where the
proof verification will go, not an auth mechanism.

There are no environment variables, no API keys, and no `.env` file. The app
runs with nothing configured.

## Running it

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. You will be redirected to `/login`.

## Project structure

```
physio-portal/
├── app/
│   ├── (app)/                       # Session-gated routes
│   │   ├── layout.tsx               # Session guard (placeholder)
│   │   ├── page.tsx                 # Patient list
│   │   ├── patients/[sessionId]/    # Individual patient portal
│   │   └── api/
│   │       ├── auth/                # Login / logout (placeholder)
│   │       └── sessions/            # Read + approve + edit-plan
│   └── (auth)/login/                # Login screen (placeholder)
├── components/                      # Portal UI
├── data/sessions.seed.json          # Fixture sessions
├── lib/
│   ├── auth/session.ts              # Cookie name + placeholder notice
│   ├── store/sessions.ts            # In-memory session store
│   ├── mapToRegion.ts               # Pain zone → body map coordinates
│   └── api/session.ts               # Server-side read helper
└── proxy.ts                         # Route guard (Next.js 16 proxy)
```

## Honest caveats

- This is a proof of concept exploring a pattern, not a production auth system.
- Rolling your own authentication cryptography is a well-known way to get things
  subtly wrong.
- Account recovery is unsolved. Lose the secret, lose the account.
- Session data in this repository is fabricated. No real patient data is present
  and none ever was in this repository.

## Future work

- Social recovery, or a separate recovery commitment.
- Clinician credential proofs — prove you hold a valid registration without
  revealing which clinician you are.
