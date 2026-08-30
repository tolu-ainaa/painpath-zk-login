# PainPath ZK Login — Devpost submission copy

Everything below is paste-ready. Section headings match Devpost's defaults.

---

## Inspiration

PainPath is a chronic pain platform. Patients paint their pain onto a body model
in AR on a Meta Quest 3; physiotherapists review those sessions in a web portal,
adjust an AI-generated exercise plan, and approve it.

The portal had a login. Email, password, the usual — and a credential store
sitting behind it.

That store is the part that kept bothering me. A pain diary is not a low-stakes
dataset. It says who is in pain, where, how badly, and for how long. If an
attacker gets the credential table, they get the door to all of it, and the
people behind that door are already having a bad time.

The safest credential database is the one that does not exist. Midnight is the
first platform where "does not exist" is something you can actually implement
rather than something you put on a slide.

## What it does

A clinician logs into PainPath **without a password**, and without the server
ever learning anything that could be used to impersonate them.

1. The clinician's device generates 256 bits of crypto-random entropy. It never
   leaves that machine.
2. `register` hashes it with a domain-separated prefix and publishes **only the
   commitment** to the Midnight ledger.
3. To log in, the portal issues a fresh random challenge. The clinician proves
   they know a secret whose commitment is in the registered set. The proof emits
   a **nullifier** bound to that challenge.
4. The portal watches the ledger. A nullifier it has never seen appears — and
   only then does it open a session.

What the server holds afterwards: no password, no hash, no salt, no secret.
What the ledger holds: two sets of 32-byte hashes, neither invertible.

Replaying a captured proof fails, because the nullifier is already spent. A
fresh login still works, because the next challenge produces a different one.

## How we built it

> **Prior work, declared.** The PainPath physio portal (Next.js — patient list,
> pain heatmap, AI assessment, plan editing, approval flow), the Meta Quest 3
> Unity app, the Firestore schema and the Gemini-backed plan generation **all
> predate this weekend**. The exact pre-hackathon state is preserved at the git
> tag `baseline-firebase-auth`, committed untouched as the first commit so the
> weekend's work reads as a clean diff.
>
> **Built this weekend:** the Compact contract and its tests, the clinician
> agent, the local Midnight stack, the challenge/nullifier session gate, and the
> verifier panel. Firebase Auth, Firestore and the Quest ingest pipeline were
> removed.

The contract is Compact, forked from the bulletin board tutorial rather than
started from an empty file:

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

The compiler's own manifest is the leak check: `register` takes **no public
arguments at all**. The secret exists only as a witness, and both ledger fields
can hold nothing but 32-byte hashes.

Around it: the pre-existing Next.js portal, a local Midnight stack in Docker
(node, indexer, proof server), and a clinician agent holding the secret in
`LevelPrivateStateProvider`, which encrypts at rest.

## Challenges we ran into

**A design flaw we shipped and then caught.** The obvious nullifier is
`H(domain, secret)`. We built that, then realised it makes every account
**single use** — the second login finds its own nullifier already spent. Binding
the nullifier to a per-login challenge fixes it: a replayed proof still collides
because the challenge is unchanged, but a fresh login succeeds. There is a test
asserting exactly that.

**Three bugs, two of them the same disease.** Duplicate module instances break
identity checks, and the error messages actively mislead you. Three copies of
`compact-js` meant three distinct `Symbol()` keys, so a contract lookup returned
`undefined` and we got `Cannot read properties of undefined (reading 'ctor')`.
Two copies of `onchain-runtime-v3` meant `StateValue` failed `instanceof` across
them. Both were fixed by making the repo an npm workspace with pinned overrides
— which is exactly how the Midnight examples are structured, a detail that stays
invisible until you copy their code into a differently shaped repo.

**A path with a space in it.** `new URL(import.meta.url).pathname` is
percent-encoded. Our repo lives under `Coding Projects`, so the ZK config
provider looked in `/Coding%20Projects/...`, found nothing, and reported
`Failed to read verifier key`. The keys were on disk and correct the entire
time.

**Windows.** Midnight has no native Windows support, so the toolchain lives in
WSL. Turbopack cannot handle WASM plus top-level await, so the portal builds
with `--webpack` and explicit `asyncWebAssembly` experiments. One `node_modules`
cannot serve both platforms, so everything runs Linux-side.

## Accomplishments that we're proud of

**The replay is refused by the circuit, not by us.** On a real node:

```
replay rejected: failed assert: this proof has already been used
```

That string is the contract's own assert, fired on chain. We didn't catch it in
application code and log something reassuring.

**We closed our own bypass.** For most of the build the portal's login was a
placeholder that set a cookie unconditionally — the chain enforced the rule and
the web app never asked it. Anyone could walk in. That gap is now shut: an
unauthenticated request is redirected, a forged cookie matches no server-side
session, and a session opens only when a nullifier appears that was not on the
ledger when the challenge was issued.

**The claim is checkable, not assertable.** The verifier panel dumps every
cookie, every environment variable name, the session store and every file on
disk, right next to the ledger's contents. Server: four zeros. Chain: hashes.
Anyone can open it — it is deliberately unauthenticated.

**The contract compiled first try**, and 14 tests cover registration,
authentication, replay rejection, repeated login with a fresh challenge,
unregistered secrets, cross-clinician isolation, domain separation, and that
nothing but 32-byte hashes ever reaches the ledger.

## What we learned

That "the server stores nothing" is a claim you have to be able to **show**. It
is easy to say and almost impossible to believe without evidence, which is why
the verifier panel exists and why it is open to anyone.

That the compiler is a real safety net. Compact refuses to let witness data
reach the ledger without an explicit `disclose()`, and the generated manifest
told us definitively that `register` has no public inputs at all — a stronger
guarantee than reading our own code and hoping.

That witnesses are untrusted input. The docs are blunt about it: never assume a
witness returns what your implementation returns. Every circuit asserts.

And that the honest version of a security claim is narrower than the exciting
one, and worth considerably more.

## What's next for Painpath portal with Midnight integration

**Deploy to preprod.** The contract is network-agnostic and the same build
targets testnet; we prioritised a working end-to-end round trip on a local node
over a deployment.

**Record `challenge → nullifier` in the contract.** Today the portal checks that
*a* new nullifier appeared, which means concurrent logins could bind a session to
the wrong one. Storing the pairing on chain removes that caveat entirely.

**Move the clinician's side into the browser.** It currently runs as a local
agent, because submitting a transaction needs a wallet and Lace only connects to
its own networks. The security property is identical — the portal never sees the
secret — but a browser tab is a better story than a process.

**Social recovery, or a recovery commitment.** Account recovery is unsolved:
lose the secret, lose the account.

**Clinician credential proofs.** Prove you hold a valid professional
registration without revealing *which* clinician you are — moving from "login"
to "verify without revealing".

---

### Honest caveats (worth keeping somewhere in the submission)

- A proof of concept exploring a pattern, not a production auth system.
- Rolling your own authentication cryptography is a well-known way to get things
  subtly wrong.
- Runs against a local Midnight node, not testnet.
- Concurrent logins could bind a session to the wrong nullifier.
- Account recovery is unsolved.
- Session data in the repository is fabricated; no real patient data is present.

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

---

## Tell us more about your experience working with Midnight

### What worked well

**Compact's disclosure model is the best part of the platform.** Having to write
`disclose()` explicitly before witness data can reach the ledger turns "did I
leak something?" from a code review question into a compiler error. The
generated `contract-info.json` sealed it — being able to read that `register`
takes *no public arguments at all* is a far stronger guarantee than reading my
own circuit and hoping.

**The docs are blunt in the right places.** "Do not assume in your contract that
the code of any witness function is the code that you wrote in your own
implementation" reframed how I wrote every assert. That one sentence is worth a
page of prose.

**`example-bboard` is a genuinely good starting point.** Forking `post`/
`takeDown` into `register`/`authenticate` was a smaller edit than expected,
because the shape — a domain-separated commitment, a witness secret, a counter
guarding replay — already matches what a credential check needs.

**The proof server is unfussy.** Started first try, fetched and *verified* its
proving keys, and never fell over.

### What was hard

**The faucet.** This cost the most time for the least reason. Lace holds three
addresses and the faucet accepts exactly one — the Midnight **unshielded**
address (`mn_addr_preprod1…`). A Cardano address (`addr_test1…`) is silently
rejected, and a shielded address (`mn_shield-addr_preprod1…`) fails with
`InvalidAddressError`. Nothing in the faucet UI says which one it wants. There
are multiple forum threads of people stuck on exactly this, plus a separate
cluster reporting tokens that never arrive at all. A one-line hint on the form —
"paste your unshielded address, it starts `mn_addr_`" — would eliminate most of
those threads.

**There are two testnets and it isn't obvious.** `preprod` and `preview` have
separate faucets, and the wallet extension is called "Lace Midnight Preview",
which reads like the network name but isn't. One forum reply noted the docs
pointed at the wrong faucet link entirely.

**Version drift across the docs.** `example-bboard`'s README asks for Lace
1.36.0+, the store ships 2.39.0, and the Lace team's own note says everything
below 2.36 must be deleted and recreated. The toolchain page shows proof server
`8.1.0` while the repo pins `8.0.3`.

**Windows is unsupported, and I found out late.** The one line stating this
lives on the toolchain install page, not on the tutorial landing page. Everything
went into WSL, which was the right answer — but a banner earlier in the funnel
would have saved a couple of hours.

**Duplicate module instances produce baffling errors.** `compact-js` tags
compiled contracts with an unregistered `Symbol()`, so three copies in one tree
meant a lookup silently returned `undefined` and surfaced as
`Cannot read properties of undefined (reading 'ctor')`. Two copies of
`onchain-runtime-v3` meant `StateValue` failed `instanceof` and surfaced as
`expected instance of StateValue`. Neither message hints that the real problem
is package identity. The examples avoid this by being npm workspaces with pinned
`resolutions` — a structural detail that's invisible until you copy their code
into a repo shaped differently.

**A path with a space in it broke the ZK config provider.** `bboard-cli` uses
`new URL(import.meta.url).pathname`, which is percent-encoded. Our repo lives
under `Coding Projects`, so it looked in `/Coding%20Projects/…` and reported
`Failed to read verifier key`. The keys were correct the whole time.
`fileURLToPath` fixes it, and the examples should probably use it.

**A half-finished install reports itself as complete.** On a minimal Ubuntu
image the Compact installer fails with "Failed to spawn artifact extraction
command" because `unzip` is missing — then leaves a version directory containing
only an unextracted `artifact.zip`, after which `compact update 0.31.0` says
`already installed` while `compactc` does not exist.

### What would make it better

1. **Tell the faucet user which address to paste.** One line of helper text.
2. **Ship `fileURLToPath` in the examples**, so paths with spaces work.
3. **Make the examples' workspace/pinning requirement explicit** — a note saying
   "these packages must resolve to a single instance; use overrides" would have
   saved hours.
4. **Have `compact update` verify the binary exists** before reporting success.
5. **Surface the standalone path much earlier.** `bboard-cli` has a `standalone`
   script that spins up node + indexer + proof server via testcontainers with a
   funded genesis wallet — no faucet, no tDUST. It is not mentioned in the
   tutorial, and it is by far the fastest way to a working round trip. We only
   found it by reading `package.json`. Leading with it would remove the faucet
   from the critical path for every hackathon participant.
6. **Put the Windows/WSL note on the tutorial landing page**, not only the
   install page.
