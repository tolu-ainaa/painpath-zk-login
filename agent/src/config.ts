import path from "node:path";
import { fileURLToPath } from "node:url";
import type { EnvironmentConfiguration } from "@midnight-ntwrk/testkit-js";

/*
 * fileURLToPath, not `new URL(...).pathname`.
 *
 * bboard-cli uses .pathname, which is percent-encoded — it returns
 * "/Coding%20Projects/..." for any path containing a space. That silently
 * produces a directory that does not exist, and the failure surfaces much
 * later as "Failed to read verifier key". Their repo path has no spaces;
 * this one does.
 */
export const currentDir = path.resolve(fileURLToPath(import.meta.url), "..");

/*
 * The local stack from docker/midnight-local.yml.
 *
 * bboard-cli gets this object from testkit's getTestEnvironment(), which
 * starts containers on random ports. We pin the ports instead so the portal
 * and the agent can both be configured against them.
 */
export const localEnvironment: EnvironmentConfiguration = {
  walletNetworkId: "undeployed",
  networkId: "undeployed",
  indexer: "http://127.0.0.1:8088/api/v4/graphql",
  indexerWS: "ws://127.0.0.1:8088/api/v4/graphql/ws",
  node: "http://127.0.0.1:9944",
  nodeWS: "ws://127.0.0.1:9944",
  proofServer: "http://127.0.0.1:6300",
} as EnvironmentConfiguration;

/*
 * The dev-preset node funds this wallet at genesis, which is why the local
 * flow needs no faucet and no tDUST. It is a well-known development seed and
 * is worthless outside a local chain.
 */
export const GENESIS_SEED =
  "0000000000000000000000000000000000000000000000000000000000000001";

/** Where the compiled circuits and keys live, for the ZK config provider. */
export const zkConfigPath = path.resolve(
  currentDir,
  "..",
  "..",
  "contract",
  "src",
  "managed",
  "painpath",
);

export const privateStateStoreName = "painpath-private-state";
export const privateStateKey = "painpathPrivateState";
