/*
 * The clinician agent: register, authenticate, and prove that a replayed proof
 * is rejected — against a real Midnight node with real zero-knowledge proofs.
 *
 * This is the clinician's device, not the portal's server. The portal never
 * runs this code and never sees the secret it holds.
 */

import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";

// Must happen before providers are constructed.
setNetworkId("undeployed");

import { deployContract } from "@midnight-ntwrk/midnight-js-contracts";
import { httpClientProofProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import { levelPrivateStateProvider } from "@midnight-ntwrk/midnight-js-level-private-state-provider";
import { NodeZkConfigProvider } from "@midnight-ntwrk/midnight-js-node-zk-config-provider";
import { toHex } from "@midnight-ntwrk/midnight-js-utils";
import { firstValueFrom, map } from "rxjs";
import { webcrypto } from "node:crypto";
import { WebSocket } from "ws";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";

import { MidnightWalletProvider } from "./midnight-wallet-provider";
import { syncWallet } from "./wallet-utils";
import { createLogger } from "./logger-utils";
import {
  GENESIS_SEED,
  localEnvironment,
  privateStateKey,
  privateStateStoreName,
  zkConfigPath,
} from "./config";

import * as PainPath from "../../contract/src/managed/painpath/contract/index.js";
import { PainPathContract } from "../../contract/src/index";
import { createPainPathPrivateState } from "../../contract/src/witnesses";

const line = (s = "") => console.log(s);
const rule = (title: string) => {
  line();
  line(`${"=".repeat(64)}`);
  line(`  ${title}`);
  line(`${"=".repeat(64)}`);
};

const randomBytes32 = (): Uint8Array =>
  webcrypto.getRandomValues(new Uint8Array(32));

/*
 * LevelPrivateStateProvider encrypts private state at rest and requires a
 * passphrase meeting its own policy: 16+ characters and at least three of
 * uppercase / lowercase / digits / symbols.
 *
 * Read it from the environment if set, otherwise mint a strong one and keep it
 * in a gitignored file so the store stays readable between runs. Nothing here
 * is a shared secret — it protects one developer's local LevelDB.
 */
function passphrase(): string {
  const fromEnv = process.env.PAINPATH_AGENT_PASSPHRASE;
  if (fromEnv) return fromEnv;

  const file = ".secrets/agent-passphrase";
  if (existsSync(file)) return readFileSync(file, "utf8").trim();

  const raw = Buffer.from(webcrypto.getRandomValues(new Uint8Array(24))).toString("base64url");
  const generated = `Aa1!${raw}`;
  mkdirSync(".secrets", { recursive: true });
  writeFileSync(file, generated, { mode: 0o600 });
  line(`generated a local passphrase for the encrypted private state store -> ${file}`);
  return generated;
}

async function main() {
  const logger = await createLogger("./logs/agent.log");

  rule("1. Wallet");
  const walletProvider = await MidnightWalletProvider.build(
    logger,
    localEnvironment,
    GENESIS_SEED,
  );
  await walletProvider.start();
  await syncWallet(logger, walletProvider.wallet);
  line("wallet synced against the local dev chain");

  // The proof provider needs the ZK config provider, so build that first.
  const zkConfigProvider = new NodeZkConfigProvider<
    "register" | "authenticate"
  >(zkConfigPath);

  const providers = {
    privateStateProvider: levelPrivateStateProvider<typeof privateStateKey>({
      privateStateStoreName,
      privateStoragePasswordProvider: () => passphrase(),
      accountId: "painpath-local-clinician",
    }),
    publicDataProvider: indexerPublicDataProvider(
      localEnvironment.indexer,
      localEnvironment.indexerWS,
      WebSocket as never,
    ),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(
      localEnvironment.proofServer,
      zkConfigProvider,
    ),
    walletProvider,
    midnightProvider: walletProvider,
  };

  // The clinician's secret: 256 bits of crypto-random entropy, generated here
  // and stored via LevelPrivateStateProvider, which encrypts at rest.
  const secret = randomBytes32();
  line(`secret generated locally (never transmitted): ${toHex(secret).slice(0, 16)}…`);

  rule("2. Deploy");
  const deployed = await deployContract(providers as never, {
    compiledContract: PainPathContract,
    privateStateId: privateStateKey,
    initialPrivateState: createPainPathPrivateState(secret),
  });
  const address = deployed.deployTxData.public.contractAddress;
  line(`contract deployed at ${address}`);

  const readLedger = async () =>
    firstValueFrom(
      providers.publicDataProvider
        .contractStateObservable(address, { type: "latest" })
        .pipe(map((s) => PainPath.ledger(s.data))),
    );

  const dump = async (label: string) => {
    const l = await readLedger();
    line(`${label}`);
    line(`  commitments (${l.commitments.size()}): ${[...l.commitments].map(toHex).join(", ") || "—"}`);
    line(`  nullifiers  (${l.nullifiers.size()}): ${[...l.nullifiers].map(toHex).join(", ") || "—"}`);
    return l;
  };

  await dump("ledger at deploy:");

  rule("3. Register");
  await deployed.callTx.register();
  const afterRegister = await dump("ledger after register:");

  const expectedCommitment = PainPath.pureCircuits.credentialCommitment(secret);
  line();
  line(`commitment matches H("painpath:cred:", secret): ${afterRegister.commitments.member(expectedCommitment)}`);
  line(`ledger contains the secret itself: ${[...afterRegister.commitments].map(toHex).includes(toHex(secret))}`);

  rule("4. Authenticate");
  const challenge1 = randomBytes32();
  line(`portal issues challenge: ${toHex(challenge1)}`);
  await deployed.callTx.authenticate(challenge1);
  const afterAuth = await dump("ledger after authenticate:");
  const expectedNullifier = PainPath.pureCircuits.sessionNullifier(challenge1, secret);
  line();
  line(`nullifier matches H("painpath:auth:", challenge, secret): ${afterAuth.nullifiers.member(expectedNullifier)}`);

  rule("5. Replay the same proof (must fail)");
  let replayRejected = false;
  let replayError = "";
  try {
    await deployed.callTx.authenticate(challenge1);
    line("!!! REPLAY SUCCEEDED — this is a security failure");
  } catch (e) {
    replayRejected = true;
    replayError = e instanceof Error ? e.message : String(e);
    line(`replay rejected: ${replayError.split("\n")[0]}`);
  }

  rule("6. Fresh challenge (must succeed)");
  const challenge2 = randomBytes32();
  line(`portal issues a new challenge: ${toHex(challenge2)}`);
  await deployed.callTx.authenticate(challenge2);
  const final = await dump("final ledger:");

  rule("RESULT");
  line(`contract address           : ${address}`);
  line(`commitments on ledger      : ${final.commitments.size()}`);
  line(`nullifiers spent           : ${final.nullifiers.size()}`);
  line(`replay rejected            : ${replayRejected}`);
  line(`secret present on ledger   : ${[...final.commitments, ...final.nullifiers].map(toHex).includes(toHex(secret))}`);
  line();
  line("Everything above that reached the ledger is a 32-byte hash.");

  await walletProvider.stop();
  process.exit(replayRejected ? 0 : 1);
}

main().catch((e) => {
  console.error("\nAGENT FAILED\n", e);
  process.exit(1);
});
