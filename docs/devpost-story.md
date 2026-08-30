# PainPath ZK Login — Devpost submission copy

Paste the section below into the "Project Story" field.

---

## Inspiration

PainPath is a chronic pain platform. Patients paint their pain onto a body
model in AR on a Meta Quest 3; physiotherapists review those sessions in a web
portal, adjust an AI-generated exercise plan, and approve it.

The portal had a login. Email, password, the usual. And a credential store
sitting behind it.

That store is the part that kept bothering me. A pain diary is not a low-stakes
dataset — it says who is in pain, where, how badly, and for how long. If an
attacker gets the credential table, they get the door to all of it. The safest
credential database is the one that does not exist, and Midnight is the first
platform where "does not exist" is actually implementable rather than a slogan.

## What it does

A clinician logs into PainPath without a password, and without the server ever
learning anything that could impersonate them.

1. The clinician's device generates 256 bits of crypto-random entropy. It never
   leaves that machine.
2. `register` hashes it with a domain-separated prefix and publishes **only the
   commitment** to the Midnight ledger.
3. To log in, the portal issues a random challenge. The clinician proves they
   know a secret whose commitment is in the registered set, and the proof emits
   a **nullifier** bound to that challenge.
4. The portal watches the ledger. A nullifier it has never seen appears, and
   only then does it open a session.

The server has no password, no hash, no salt, and no secret. The ledger has two
sets of 32-byte hashes. Neither is invertible.

## How we built it

The contract is Compact, forked from the bulletin board tutorial:

```
export ledger commitments: Set<Bytes<32>>;
export ledger nullifiers:  Set<Bytes<32>>;

witness localSecret(): Bytes<32>;

export circuit credentialCommitment(sk: Bytes<32>): Bytes<32> {
  return persistentHash<Vector<2, Bytes<32>>>([pad(32, "painpath:cred:"), sk]);
}

export circuit sessionNullifier(challenge: Bytes<32>, sk: Bytes<32>): Bytes<32> {
  return persistentHash<Vector<3, Bytes<32>>>(
    [pad(32, "painpath:auth:"), challenge, sk]
  );
}
```

`register` asserts the commitment is not already present, then inserts it.
`authenticate` asserts set membership, derives the challenge-bound nullifier,
asserts it is unspent, and spends it. Two distinct domain prefixes mean a
nullifier can never be replayed as a commitment.

The compiler's own manifest is the leak check. `register` takes **no public
arguments at all** — the secret exists only as a witness, and both ledger fields
can hold nothing but 32-byte hashes.

Around it: a Next.js portal (the pre-existing app), a local Midnight stack in
Docker, and a clinician agent that holds the secret in `LevelPrivateStateProvider`,
which encrypts at rest.

## The design decision we changed

The obvious nullifier is `H(domain, secret)`. We built that first, then realised
it makes every account **single use** — the second login finds its own nullifier
already spent.

Binding the nullifier to a per-login challenge fixes it: replaying a captured
proof still collides, because the challenge is the same, but a fresh login with
a new challenge succeeds. There is a test asserting exactly that.

## Challenges we ran into

**Three bugs, two of them the same disease.** Duplicate module instances break
identity checks in ways the error messages actively mislead you about. Three
copies of `compact-js` meant three distinct `Symbol()` keys, so a contract
lookup returned `undefined`. Two copies of `onchain-runtime-v3` meant
`StateValue` failed `instanceof` across them. Both were fixed by making the repo
an npm workspace with pinned overrides — which is exactly how the Midnight
examples are structured, a detail that is invisible until you copy their code
into a differently shaped repo.

**A path with a space in it.** `new URL(import.meta.url).pathname` is
percent-encoded. Our repo lives under `Coding Projects`, so the ZK config
provider looked in `/Coding%20Projects/...`, found nothing, and reported it as
a missing verifier key. The keys were fine the entire time.

**Midnight has no native Windows support**, so the whole toolchain lives in WSL,
and Turbopack cannot handle WASM plus top-level await — the portal builds with
`--webpack` and explicit `asyncWebAssembly` experiments.

## What we learned

That "the server stores nothing" is a claim you have to be able to *show*, not
assert. So we built a verifier panel that dumps every cookie, every environment
variable name, the session store and every file on disk, next to the ledger's
contents. Server: four zeros. Chain: hashes. Both checkable by anyone.

Also that the honest version of a security claim is narrower than the
exciting one, and worth more.

## Prior work — declared

Everything below predates this weekend and is **prior work**:

- The PainPath physio portal (Next.js): patient list, pain heatmap, AI
  assessment, plan editing, approval flow
- The Meta Quest 3 Unity app (separate repository, not included here)
- The Firestore schema and the Gemini-backed exercise plan generation

The exact pre-hackathon state is preserved at the git tag
`baseline-firebase-auth`, committed untouched as the first commit so the
weekend's work reads as a clean diff.

**Built this weekend:** the Compact contract and its tests, the clinician agent,
the local Midnight stack, the challenge/nullifier session gate, and the verifier
panel. Firebase Auth, Firestore and the Quest ingest pipeline were removed.

## Honest caveats

- This is a proof of concept exploring a pattern, not a production auth system.
- Rolling your own authentication cryptography is a well-known way to get things
  subtly wrong.
- It runs against a **local Midnight node**, not testnet. The contract is
  network-agnostic and the same build targets preprod; we prioritised a working
  end-to-end round trip over a deployment.
- With two logins in flight simultaneously the portal could bind a session to
  the wrong nullifier. The fix is to record `challenge → nullifier` in the
  contract itself.
- Account recovery is unsolved. Lose the secret, lose the account.
- The clinician's side runs as a local agent rather than in the browser, because
  submitting a transaction needs a wallet and Lace only connects to its own
  networks. The security property is identical — the portal never sees the
  secret — but the device is a process, not a tab.

## What's next

- Social recovery, or a separate recovery commitment
- `challenge → nullifier` in the contract, removing the concurrency caveat
- Clinician credential proofs: prove you hold a valid registration without
  revealing which clinician you are

---

## Built with

```
midnight, compact, compactc, zero-knowledge-proofs, zk-snarks, typescript,
nextjs, react, tailwindcss, nodejs, docker, wsl, vitest, leveldb, rxjs,
midnight-js, webpack, webassembly
```

## Try it out

```
https://github.com/tolu-ainaa/painpath-zk-login
```
