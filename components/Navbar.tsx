'use client'

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";


const Navbar = () => {
  const router = useRouter();

  const [logoutPending, startLogoutTransition] = useTransition();
  async function handleSignOut() {
    startLogoutTransition(async () => {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    });
  }

  

  return (
          <div className="flex items-center justify-between bg-white border border-black/[0.12] rounded-xl px-4 py-3 mb-4">
        <div className="flex items-center gap-[10px]">
          <Link href="/" className="w-6 h-6 rounded-md bg-[#0F6E56] flex items-center justify-center">
            <svg viewBox="0 0 20 20" fill="none" className="w-3 h-3">
              <path d="M10 3C10 3 4 7 4 12a6 6 0 0012 0C16 7 10 3 10 3z" fill="white" opacity="0.9"/>
              <circle cx="10" cy="12" r="2" fill="white"/>
            </svg>
          </Link>
          <span className="text-[15px] font-medium text-[#2C2C2A]">PainPath</span>
          <span className="text-[10px] font-medium px-2 py-[2px] rounded-full bg-[#EEEDFE] text-[#3C3489]">
            Physio portal
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[12px] text-[#888780]">Dr. Sarah Okafor · NHS Belfast</span>
          <button
            onClick={handleSignOut}
            className="text-[11px] text-[#888780] hover:text-[#2C2C2A] border border-black/10 rounded-lg px-3 py-1.25 transition-colors cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
          >
            {logoutPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />{" "}
                  <span>Signing out...</span>
                </>
              ) : (
                "Sign out"
              )}
          </button>
        </div>
      </div>
  )
}

export default Navbar