// The login screen.
//
// There is no password field, because there is no password. The portal issues
// a challenge, the clinician proves knowledge of their secret on their own
// device, and the portal opens a session only once a nullifier appears on the
// ledger that was not there when the challenge was issued.
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

type ChallengeState = {
  challengeId: string;
  challenge: string;
  contractAddress: string;
  registeredCredentials: number;
  nullifiersAtIssue: number;
};

type Phase = "starting" | "waiting" | "authenticated" | "error";

export default function LoginPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("starting");
  const [challenge, setChallenge] = useState<ChallengeState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nullifiersNow, setNullifiersNow] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(async () => {
    setPhase("starting");
    setError(null);
    setChallenge(null);
    try {
      const res = await fetch("/api/auth/challenge", { method: "POST" });
      const body = await res.json();
      if (!res.ok) {
        setError(body.message ?? "Could not start a login.");
        setPhase("error");
        return;
      }
      setChallenge(body);
      setNullifiersNow(body.nullifiersAtIssue);
      setPhase("waiting");
    } catch {
      setError("The portal could not reach the Midnight ledger.");
      setPhase("error");
    }
  }, []);

  useEffect(() => {
    void start();
  }, [start]);

  // Poll for the proof to land.
  useEffect(() => {
    if (phase !== "waiting" || !challenge) return;

    const tick = async () => {
      try {
        const res = await fetch("/api/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ challengeId: challenge.challengeId }),
        });
        const body = await res.json();

        if (body.status === "authenticated") {
          setPhase("authenticated");
          if (pollRef.current) clearInterval(pollRef.current);
          setTimeout(() => router.push("/"), 900);
        } else if (body.status === "expired") {
          setError("That login attempt expired. Starting a new one.");
          void start();
        } else if (typeof body.nullifiersNow === "number") {
          setNullifiersNow(body.nullifiersNow);
        }
      } catch {
        /* keep polling */
      }
    };

    pollRef.current = setInterval(tick, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [phase, challenge, router, start]);

  const command = challenge
    ? `npm run login -- ${challenge.challenge}`
    : "";

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "#F1EFE8" }}
    >
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[#0F6E56] flex items-center justify-center">
              <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
                <path
                  d="M10 3C10 3 4 7 4 12a6 6 0 0012 0C16 7 10 3 10 3z"
                  fill="white"
                  opacity="0.9"
                />
                <circle cx="10" cy="12" r="2" fill="white" />
              </svg>
            </div>
            <span className="text-[18px] font-semibold text-[#2C2C2A]">
              PainPath
            </span>
          </div>
          <p className="text-[13px] text-[#888780]">
            Prove you hold a clinician credential. Don&apos;t reveal it.
          </p>
        </div>

        <div className="bg-white border border-black/[0.1] rounded-2xl p-6 shadow-sm">
          {phase === "error" && (
            <>
              <div className="text-[12px] text-[#A32D2D] bg-[#FCEBEB] px-3 py-2 rounded-lg mb-4">
                {error}
              </div>
              <button
                onClick={() => void start()}
                className="w-full py-2.5 rounded-lg bg-[#0F6E56] text-[#E1F5EE] text-[13px] font-medium cursor-pointer"
              >
                Try again
              </button>
            </>
          )}

          {phase === "starting" && (
            <div className="flex items-center gap-2 text-[13px] text-[#888780]">
              <Loader2 className="size-4 animate-spin" />
              Reading the ledger…
            </div>
          )}

          {phase === "authenticated" && (
            <div className="text-center py-4">
              <div className="text-[15px] font-medium text-[#0F6E56] mb-1">
                Proof verified
              </div>
              <p className="text-[12px] text-[#888780]">
                A nullifier appeared on the ledger. Opening your session…
              </p>
            </div>
          )}

          {phase === "waiting" && challenge && (
            <>
              <div className="text-[10px] font-medium text-[#888780] uppercase tracking-[0.05em] mb-2">
                Step 1 — this login&apos;s challenge
              </div>
              <div className="text-[11px] font-mono break-all bg-[#F1EFE8] rounded-lg p-3 text-[#2C2C2A] mb-4">
                {challenge.challenge}
              </div>

              <div className="text-[10px] font-medium text-[#888780] uppercase tracking-[0.05em] mb-2">
                Step 2 — prove it on your device
              </div>
              <div className="relative mb-1">
                <pre className="text-[11px] font-mono bg-[#2C2C2A] text-[#E1F5EE] rounded-lg p-3 overflow-x-auto">
                  {command}
                </pre>
                <button
                  onClick={() => {
                    void navigator.clipboard.writeText(command);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                  className="absolute top-2 right-2 text-[10px] px-2 py-1 rounded bg-white/10 text-[#E1F5EE] hover:bg-white/20 cursor-pointer"
                >
                  {copied ? "copied" : "copy"}
                </button>
              </div>
              <p className="text-[11px] text-[#888780] mb-4 leading-[1.5]">
                Run this in the <code>agent/</code> directory. Your secret never
                leaves that machine — only the proof reaches the chain.
              </p>

              <div className="flex items-center gap-2 text-[12px] text-[#888780] border-t border-black/[0.08] pt-4">
                <Loader2 className="size-3.5 animate-spin" />
                <span>
                  Watching the ledger — {nullifiersNow ?? "?"} nullifiers spent,
                  waiting for a new one
                </span>
              </div>

              <div className="mt-3 text-[11px] text-[#B4B2A9] leading-[1.5]">
                {challenge.registeredCredentials} credential
                {challenge.registeredCredentials === 1 ? "" : "s"} registered on
                contract {challenge.contractAddress.slice(0, 16)}…
              </div>
            </>
          )}
        </div>

        <p className="text-center text-[11px] text-[#B4B2A9] mt-5 leading-[1.5]">
          Proof of concept — not for clinical use.
          <br />
          <a href="/verifier" className="underline hover:text-[#888780]">
            See everything this server stores
          </a>
        </p>
      </div>
    </div>
  );
}
