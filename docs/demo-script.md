# Demo script — PainPath ZK Login

**Target: 2:00 maximum.** Devpost rejects anything longer.

---

## Pre-flight (do this before you hit record)

Check the stack is up:

```bash
docker compose -f docker/midnight-local.yml up -d
```

Check the portal is serving — <http://localhost:3000/login> should render.

**Deploy and register ONCE.** In WSL:

```bash
wsl -d Ubuntu --cd "/mnt/d/Coding Projects/Major league Hacking/Midnight/physio-portal/agent"
npm run local
```

> ⚠️ **After this, never run `npm run local` again during the shoot.** It deploys
> a fresh contract and wipes the ledger — your registered credential stops
> working and footage from before won't match.

Then for every take, only:

```bash
npm run login -- <paste the hex from the login page>
```

### Windows to have open

| Window | Contents |
|---|---|
| **A** | Browser — `localhost:3000` |
| **B** | WSL terminal, in `agent/` |
| **C** | Second terminal for the "before" shots (any shell) |

---

## Shot list

### 0:00–0:06 — Title card

> **On screen:** "Midnight Hackathon" then "PainPath ZK Login"

**Required by the rules** — the hackathon name must be stated at the start.

---

### 0:06–0:16 — The app that already existed

> **Screen:** Window A — `localhost:3000`, patient list, click into one patient
> to show the pain heatmap.

**Say:**
> "PainPath is a chronic pain platform. Patients map their pain in AR;
> physiotherapists review it here. This portal already existed."

---

### 0:16–0:30 — The old login, and what sat behind it

> **Screen:** Window C. Run these two commands, let each sit for ~5 seconds.

```bash
git show baseline-firebase-auth:"app/(auth)/login/page.tsx" | grep -n "type=\"password\"" -B3 -A3
```

```bash
git show baseline-firebase-auth:Readme.md | grep -n "FIREBASE_PRIVATE_KEY"
```

**Say:**
> "It authenticated with an email and a password, checked against a credential
> store. That store is the problem. A pain diary tells an attacker who is
> hurting, where, and how badly. The safest credential database is the one that
> doesn't exist."

---

### 0:30–0:42 — The new login

> **Screen:** Window A — `localhost:3000/login`. Let the page breathe. Point at
> the challenge and the live "watching the ledger" line.

**Say:**
> "There's no password field, because there's no password. The portal issues a
> random challenge and then watches the Midnight ledger."

Click **copy** on the command.

---

### 0:42–1:05 — The proof  ⏩ *speed up 6× in the edit*

> **Screen:** Split — Window B (terminal) left, Window A (login page) right.

Paste and run. Real time is ~2m56s; cut it to ~20 seconds.

**Say (over the sped-up footage):**
> "The secret is generated on the clinician's device and never leaves it. What
> goes to the chain is a proof — and a nullifier bound to this one challenge."

Let these lines land at full speed:
```
credential loaded from encrypted private state
expected nullifier <hash>
generating proof and submitting…
```

---

### 1:05–1:15 — The session opens by itself

> **Screen:** Window A. The page flips to **"Proof verified"** and redirects
> into the portal. Don't touch the mouse — that's the point.

**Say:**
> "The portal saw a nullifier appear that wasn't there when it issued the
> challenge. Only a proof against a registered credential can do that. So it
> opens the session."

---

### 1:15–1:28 — The replay fails

> **Screen:** Window B. Press **↑** and run the exact same command again.

**Say:**
> "Replay the same proof…"

Hold on this line when it appears:
```
failed assert: this proof has already been used
```

**Say:**
> "That's the contract refusing it. On chain — not our code catching an error."

---

### 1:28–1:48 — What the server actually stores

> **Screen:** Window A — `localhost:3000/verifier`. Full frame. Scroll slowly
> from the four zeros down to the ledger section.

**Say:**
> "This is everything the server holds. No password hashes. No salts. No
> secrets. And this is everything on the chain — commitments and nullifiers,
> 32-byte hashes, none of them reversible. Breach this server and there's
> nothing to steal, because there's nothing here."

---

### 1:48–2:00 — Why it matters

> **Screen:** Back to the patient list, or hold on the verifier panel.

**Say:**
> "This is a chronic pain diary. A breached credential table isn't an
> inconvenience — it's real harm to real people. So we removed the thing worth
> breaching."

---

## Editing notes

- **The proof stretch is the only thing that needs speeding up.** ~2m56s down to
  ~20s. Everything else plays at real time.
- **Don't intercut takes.** Each `npm run login` produces a different nullifier;
  hashes on screen won't match across runs.
- **Caption the hashes.** They're unreadable at video bitrates — a caption
  saying "commitment" and "nullifier" does more than the hex itself.
- **Audio matters more than picture.** Record narration separately if you can.

## Things not to say

- ❌ "deployed to testnet" — it runs on a **local Midnight node**
- ❌ "we deleted our password database" — the old system used **Firebase Auth**,
  so the credential store was Google's
- ❌ "unhackable" / "impossible to breach"
- ✅ "the server holds no credentials, and you can check that yourself"

## If something breaks mid-shoot

| Symptom | Fix |
|---|---|
| `syntax error near unexpected token` | You pasted `<challenge>` with the angle brackets. Use the page's copy button |
| Login page says no contract deployed | Stack is down — `docker compose -f docker/midnight-local.yml up -d` |
| `No credential found in local private state` | Someone re-ran `npm run local`. Re-run it once more, then use `npm run login` |
| Challenge expired | Reload `/login`, it issues a new one (5 minute TTL) |
