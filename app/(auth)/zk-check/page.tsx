// Bundling spike — not part of the product.
//
// Answers one question before any UI is built on top of it: does the Midnight
// WASM runtime load and execute inside a Next.js browser bundle? If the two
// hashes below render, the architecture holds. If this page throws, no amount
// of login UI would have worked.
"use client";

import { useState } from "react";

type Result = {
  secret: string;
  commitment: string;
  nullifier: string;
  sameSecretSameCommitment: boolean;
  elapsedMs: number;
};

const toHex = (b: Uint8Array) =>
  [...b].map((x) => x.toString(16).padStart(2, "0")).join("");

export default function ZkCheckPage() {
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    setError(null);
    setResult(null);
    const started = performance.now();

    try {
      // Imported lazily so the WASM never touches the server render.
      const { pureCircuits } = await import(
        "@/contract/src/managed/painpath/contract/index.js"
      );

      // 256 bits of crypto-random entropy — the real secret generator will use
      // exactly this.
      const secret = crypto.getRandomValues(new Uint8Array(32));
      const challenge = crypto.getRandomValues(new Uint8Array(32));

      const commitment = pureCircuits.credentialCommitment(secret);
      const again = pureCircuits.credentialCommitment(secret);
      const nullifier = pureCircuits.sessionNullifier(challenge, secret);

      setResult({
        secret: toHex(secret),
        commitment: toHex(commitment),
        nullifier: toHex(nullifier),
        sameSecretSameCommitment: toHex(commitment) === toHex(again),
        elapsedMs: Math.round(performance.now() - started),
      });
    } catch (e) {
      setError(e instanceof Error ? `${e.name}: ${e.message}` : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen p-8" style={{ background: "#F1EFE8" }}>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-[18px] font-semibold text-[#2C2C2A] mb-1">
          WASM bundling check
        </h1>
        <p className="text-[13px] text-[#888780] mb-5">
          Runs the contract&apos;s pure circuits in the browser. No proof server,
          no wallet, no network.
        </p>

        <button
          onClick={run}
          disabled={busy}
          className="px-4 py-2 rounded-lg bg-[#0F6E56] text-[#E1F5EE] text-[13px] font-medium disabled:opacity-60 cursor-pointer"
        >
          {busy ? "Running…" : "Run check"}
        </button>

        {error && (
          <pre className="mt-5 p-4 rounded-lg bg-[#FCEBEB] text-[#A32D2D] text-[12px] whitespace-pre-wrap break-all">
            {error}
          </pre>
        )}

        {result && (
          <div className="mt-5 bg-white border border-black/[0.1] rounded-xl p-4 text-[12px] font-mono break-all flex flex-col gap-3">
            <Row label="secret (stays local)" value={result.secret} />
            <Row label="commitment" value={result.commitment} />
            <Row label="nullifier" value={result.nullifier} />
            <div className="text-[#0F6E56]">
              deterministic: {String(result.sameSecretSameCommitment)} ·{" "}
              {result.elapsedMs}ms
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.05em] text-[#888780] mb-1 font-sans">
        {label}
      </div>
      <div className="text-[#2C2C2A]">{value}</div>
    </div>
  );
}
