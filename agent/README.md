# Clinician agent

The clinician's side of the PainPath ZK login. It holds the secret, generates
the zero-knowledge proofs, and submits them to Midnight.

**This never runs on the portal server.** The portal has no code path that can
read the secret — that is the entire point of the design.

## Running it

Bring up the local Midnight stack first:

```bash
docker compose -f ../docker/midnight-local.yml up -d
```

Then, from this directory:

```bash
npm install
npm run local
```

`src/run.ts` walks six stages against the real node, printing the public ledger
after each one:

1. build and sync a wallet from the dev-preset genesis seed
2. deploy the contract
3. `register` — a commitment appears
4. `authenticate` — a nullifier is spent
5. **replay the same challenge — must fail**
6. a fresh challenge — must succeed

It exits non-zero if the replay ever succeeds, so it is a pass/fail gate rather
than a script that can quietly misreport.

## Why a local agent rather than the browser

Submitting a circuit call is a single prove-balance-submit pipeline over the
provider set, so the wallet has to live wherever the flow runs. Lace, the
browser wallet, only connects to its own networks (preprod/preview) — not to a
local node. So the local demo runs the clinician's side here, and the browser
path requires preprod and tDUST.

The security property is identical either way: the portal server never sees the
secret. What changes is whether the clinician's device is a browser tab or this
process.

Note that here — unlike in a browser — `LevelPrivateStateProvider` is available,
so the secret really is stored encrypted at rest.

## Attribution

`wallet-utils.ts`, `midnight-wallet-provider.ts`, `logger-utils.ts` and
`generate-dust.ts` are copied from
[midnightntwrk/example-bboard](https://github.com/midnightntwrk/example-bboard)
(Apache-2.0, Copyright Midnight Foundation). Their licence headers are intact.
`config.ts` and `run.ts` are ours.
