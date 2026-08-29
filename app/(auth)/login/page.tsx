// app/(auth)/login/page.tsx
//
// PLACEHOLDER — the Firebase email/password form that lived here was removed
// along with the credential store behind it. Phase 4 replaces this screen with
// the Midnight flow: generate a secret, register a commitment, then prove
// knowledge of the secret without sending it anywhere.
"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loginPending, startLoginTransition] = useTransition();

  function handleContinue() {
    setError("");

    startLoginTransition(async () => {
      try {
        const res = await fetch("/api/auth/login", { method: "POST" });
        if (!res.ok) throw new Error("Failed to create session");
        router.push("/");
      } catch (err) {
        console.error(err);
        setError("Something went wrong. Please try again.");
      }
    });
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "#F1EFE8" }}
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
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
            Physio Portal — sign in to continue
          </p>
        </div>

        <div className="bg-white border border-black/[0.1] rounded-2xl p-6 shadow-sm">
          <div className="text-[10px] font-medium text-[#888780] uppercase tracking-[0.05em] mb-2">
            Authentication
          </div>

          <p className="text-[13px] text-[#2C2C2A] leading-[1.5] mb-2">
            The password login has been removed. This portal is being rebuilt to
            authenticate clinicians with a zero-knowledge proof on Midnight — no
            password, no credential store, nothing on the server worth stealing.
          </p>
          <p className="text-[12px] text-[#888780] leading-[1.5] mb-4">
            The proof flow is not wired up yet. This button opens an
            unauthenticated session so the rest of the portal can be worked on.
          </p>

          {error && (
            <p className="text-[12px] text-[#A32D2D] bg-[#FCEBEB] px-3 py-2 rounded-lg mb-3">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleContinue}
            disabled={loginPending}
            className="w-full py-2.75 rounded-lg bg-[#0F6E56] text-[#E1F5EE] text-[13px] font-medium hover:bg-[#085041] disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2.5 cursor-pointer"
          >
            {loginPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />{" "}
                <span>Opening session...</span>
              </>
            ) : (
              "Continue without authentication"
            )}
          </button>
        </div>

        <p className="text-center text-[11px] text-[#B4B2A9] mt-6">
          Development build — not for clinical use
        </p>
      </div>
    </div>
  );
}
