import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

/*
 * Reads the contract's public ledger so the portal can show what is actually
 * on chain: a set of credential commitments and a set of spent nullifiers,
 * and nothing else.
 *
 * This is deliberately the *public* view. The portal has no secret and no
 * privileged access — anyone with the contract address can read exactly this.
 */

type ContractInfo = {
  contractAddress: string;
  network: string;
  indexer: string;
  indexerWS: string;
  deployedAt: string;
};

async function readContractInfo(): Promise<ContractInfo | null> {
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

const toHex = (b: Uint8Array) =>
  [...b].map((x) => x.toString(16).padStart(2, "0")).join("");

export async function GET() {
  const info = await readContractInfo();

  if (!info) {
    return NextResponse.json(
      {
        deployed: false,
        note: "No contract deployed yet. Run the clinician agent (agent/: npm run local) to deploy one against the local network.",
      },
      { status: 200, headers: { "cache-control": "no-store" } },
    );
  }

  try {
    // Imported lazily: these pull in the Midnight WASM runtime, which should
    // not load unless this route is actually called.
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

    if (!state) {
      return NextResponse.json(
        {
          deployed: true,
          contractAddress: info.contractAddress,
          found: false,
          note: "Contract address is known but no state came back from the indexer. Is the local stack running?",
        },
        { status: 200, headers: { "cache-control": "no-store" } },
      );
    }

    const ledger = PainPath.ledger(state.data);
    const commitments = [...ledger.commitments].map(toHex);
    const nullifiers = [...ledger.nullifiers].map(toHex);

    return NextResponse.json(
      {
        deployed: true,
        found: true,
        contractAddress: info.contractAddress,
        network: info.network,
        deployedAt: info.deployedAt,
        commitments,
        nullifiers,
        counts: {
          registeredClinicians: commitments.length,
          loginsSpent: nullifiers.length,
        },
        note: "Every entry is a 32-byte hash. A commitment is H(\"painpath:cred:\", secret); a nullifier is H(\"painpath:auth:\", challenge, secret). Neither is invertible, and no secret appears here.",
      },
      { status: 200, headers: { "cache-control": "no-store" } },
    );
  } catch (e) {
    return NextResponse.json(
      {
        deployed: true,
        contractAddress: info.contractAddress,
        found: false,
        error: e instanceof Error ? `${e.name}: ${e.message}` : String(e),
      },
      { status: 200, headers: { "cache-control": "no-store" } },
    );
  }
}
