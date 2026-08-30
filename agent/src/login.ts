/*
 * Log in to the portal.
 *
 *   npm run login -- <challenge-hex>
 *
 * Joins the already-deployed contract, reads the clinician's secret out of
 * encrypted local private state, and authenticates against the challenge the
 * portal issued. The secret never leaves this machine; the only thing that
 * reaches the chain is a nullifier.
 *
 * Provider construction is duplicated from run.ts rather than shared, because
 * run.ts is the proven end-to-end gate and I would rather not refactor it
 * under deadline.
 */

import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";

setNetworkId("undeployed");

import { findDeployedContract } from "@midnight-ntwrk/midnight-js-contracts";
import { httpClientProofProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import { levelPrivateStateProvider } from "@midnight-ntwrk/midnight-js-level-private-state-provider";
import { NodeZkConfigProvider } from "@midnight-ntwrk/midnight-js-node-zk-config-provider";
import { toHex } from "@midnight-ntwrk/midnight-js-utils";
import { WebSocket } from "ws";
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { webcrypto } from "node:crypto";

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
import type { PainPathPrivateState } from "../../contract/src/witnesses";

const line = (s = "") => console.log(s);

function passphrase(): string {
  const fromEnv = process.env.PAINPATH_AGENT_PASSPHRASE;
  if (fromEnv) return fromEnv;
  const file = ".secrets/agent-passphrase";
  if (existsSync(file)) return readFileSync(file, "utf8").trim();
  const raw = Buffer.from(webcrypto.getRandomValues(new Uint8Array(24))).toString(
    "base64url",
  );
  const generated = `Aa1!${raw}`;
  mkdirSync(".secrets", { recursive: true });
  writeFileSync(file, generated, { mode: 0o600 });
  return generated;
}

function parseChallenge(): Uint8Array {
  const arg = process.argv[2];
  if (!arg) {
    line("Usage: npm run login -- <challenge-hex>");
    line("Get the challenge from the portal's login page.");
    process.exit(1);
  }
  const clean = arg.trim().toLowerCase().replace(/^0x/, "");
  if (!/^[0-9a-f]{64}$/.test(clean)) {
    line(`Not a 32-byte hex challenge: ${arg}`);
    process.exit(1);
  }
  return Uint8Array.from(
    clean.match(/.{2}/g)!.map((b) => parseInt(b, 16)),
  );
}

async function main() {
  const challenge = parseChallenge();
  const logger = await createLogger("./logs/login.log");

  const infoPath = "../.midnight/contract.json";
  if (!existsSync(infoPath)) {
    line("No contract deployed. Run `npm run local` first — it deploys and registers.");
    process.exit(1);
  }
  const info = JSON.parse(readFileSync(infoPath, "utf8")) as {
    contractAddress: string;
  };

  line(`challenge  ${toHex(challenge)}`);
  line(`contract   ${info.contractAddress}`);
  line("");

  const walletProvider = await MidnightWalletProvider.build(
    logger,
    localEnvironment,
    GENESIS_SEED,
  );
  await walletProvider.start();
  await syncWallet(logger, walletProvider.wallet);

  const zkConfigProvider = new NodeZkConfigProvider<
    "register" | "authenticate"
  >(zkConfigPath);

  const privateStateProvider = levelPrivateStateProvider<typeof privateStateKey>({
    privateStateStoreName,
    privateStoragePasswordProvider: () => passphrase(),
    accountId: "painpath-local-clinician",
  });

  // The secret lives here, encrypted at rest, scoped to this contract.
  privateStateProvider.setContractAddress(info.contractAddress);
  const existing = (await privateStateProvider.get(
    privateStateKey,
  )) as PainPathPrivateState | null;

  if (!existing) {
    line("No credential found in local private state for this contract.");
    line("Run `npm run local` first to generate a secret and register it.");
    process.exit(1);
  }

  line(`credential loaded from encrypted private state`);
  line(
    `expected nullifier ${toHex(PainPath.pureCircuits.sessionNullifier(challenge, existing.secret))}`,
  );
  line("");

  const providers = {
    privateStateProvider,
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

  const deployed = await findDeployedContract(providers as never, {
    contractAddress: info.contractAddress,
    compiledContract: PainPathContract,
    privateStateId: privateStateKey,
    initialPrivateState: existing,
  });

  line("generating proof and submitting…");
  await deployed.callTx.authenticate(challenge);
  line("nullifier spent — the portal should open your session now.");

  await walletProvider.stop();
  process.exit(0);
}

main().catch((e) => {
  console.error("\nLOGIN FAILED\n", e);
  process.exit(1);
});
