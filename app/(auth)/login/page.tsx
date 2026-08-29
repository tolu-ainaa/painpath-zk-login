// app/(auth)/login/page.tsx
"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebaseClient";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loginPending, startLoginTransition] = useTransition();

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    startLoginTransition( async ()=>{
      try {
        // 1. Sign in with Firebase Auth — throws if wrong credentials
        const credential = await signInWithEmailAndPassword(auth, email, password);
        const idToken = await credential.user.getIdToken();
  
        // 2. Send the ID token to our server to create a secure session cookie
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        });
  
        if (!res.ok) throw new Error("Failed to create session");
  
        router.push("/");
      } catch (err: any) {
        console.error(err);
        if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
          setError("Incorrect email or password.");
        } else {
          setError("Something went wrong. Please try again.");
        }
      } 
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#F1EFE8" }}>
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[#0F6E56] flex items-center justify-center">
              <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
                <path d="M10 3C10 3 4 7 4 12a6 6 0 0012 0C16 7 10 3 10 3z" fill="white" opacity="0.9"/>
                <circle cx="10" cy="12" r="2" fill="white"/>
              </svg>
            </div>
            <span className="text-[18px] font-semibold text-[#2C2C2A]">PainPath</span>
          </div>
          <p className="text-[13px] text-[#888780]">Physio Portal — sign in to continue</p>
        </div>

        <div className="bg-white border border-black/[0.1] rounded-2xl p-6 shadow-sm">
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-[#888780] uppercase tracking-[0.05em]">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@nhs.net"
                required
                className="w-full px-3 py-[10px] rounded-lg border border-black/[0.12] text-[13px] text-[#2C2C2A] bg-[#F1EFE8] placeholder:text-[#B4B2A9] outline-none focus:border-[#0F6E56] focus:ring-2 focus:ring-[#0F6E56]/10 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-[#888780] uppercase tracking-[0.05em]">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3 py-[10px] rounded-lg border border-black/[0.12] text-[13px] text-[#2C2C2A] bg-[#F1EFE8] placeholder:text-[#B4B2A9] outline-none focus:border-[#0F6E56] focus:ring-2 focus:ring-[#0F6E56]/10 transition-all"
              />
            </div>

            {error && (
              <p className="text-[12px] text-[#A32D2D] bg-[#FCEBEB] px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={loginPending}
              className="w-full py-2.75 rounded-lg bg-[#0F6E56] text-[#E1F5EE] text-[13px] font-medium hover:bg-[#085041] disabled:opacity-60 disabled:cursor-not-allowed transition-colors mt-1 flex items-center justify-center gap-2.5"
            >
              {loginPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />{" "}
                  <span>Signing in...</span>
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-[#B4B2A9] mt-6">
          Access restricted to authorised NHS physiotherapists
        </p>
      </div>
    </div>
  );
}