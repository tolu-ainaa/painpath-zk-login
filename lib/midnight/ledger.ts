// Server-side read of the contract's public ledger.
//
// The portal has no secret and no privileged access. Everything here is what
// any observer with the contract address can read.

import { readFile } from "node:fs/promises";
import path from "node:path";

export type ContractInfo = {
  contractAddress: string;
  network: string;
  indexer: string;
  indexerWS: string;
  deployedAt: string;
};

export type LedgerView = {
  contractAddress: string;
  commitments: string[];
  nullifiers: string[];
};

export const toHex = (b: Uint8Array): string =>
  [...b].map((x) => x.toString(16).padStart(2, "0")).join("");

export async function readContractInfo(): Promise<ContractInfo | null> {
  try {
    const raw = await readFile(
      path.join(process.cwd(), ".midnight", "contract.json"),
      "utf8",
    );
    return JSON.parse(raw) as ContractInfo;
  } catch {
    return null;
  }
}

/**
 * Reads the commitment and nullifier sets from chain.
 * Returns null when no contract has been deployed or the stack is down.
 */
export async function readLedger(): Promise<LedgerView | null> {
  const info = await readContractInfo();
  if (!info) return null;

  // Imported lazily — these pull in the Midnight WASM runtime, which should
  // not load on routes that never touch the chain.
  const { setNetworkId } = await import(
    "@midnight-ntwrk/midnight-js-network-id"
  );
  setNetworkId(info.network as never);

  const { indexerPublicDataProvider } = await import(
    "@midnight-ntwrk/midnight-js-indexer-public-data-provider"
  );
  const PainPath = await import(
    "@/contract/src/managed/painpath/contract/index.js"
  );

  const provider = indexerPublicDataProvider(info.indexer, info.indexerWS);
  const state = await provider.queryContractState(info.contractAddress);
  if (!state) return null;

  const ledger = PainPath.ledger(state.data);
  return {
    contractAddress: info.contractAddress,
    commitments: [...ledger.commitments].map(toHex),
    nullifiers: [...ledger.nullifiers].map(toHex),
  };
}
