"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("[PainPath error]", error);
  }, [error]);

  const isNetworkError =
    error.message.toLowerCase().includes("fetch") ||
    error.message.toLowerCase().includes("network") ||
    error.message.toLowerCase().includes("failed to fetch") ||
    error.message.toLowerCase().includes("load failed");

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "#F1EFE8" }}
    >
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-7 h-7 rounded-lg bg-[#0F6E56] flex items-center justify-center">
            <svg viewBox="0 0 20 20" fill="none" className="w-3.5 h-3.5">
              <path d="M10 3C10 3 4 7 4 12a6 6 0 0012 0C16 7 10 3 10 3z" fill="white" opacity="0.9"/>
              <circle cx="10" cy="12" r="2" fill="white"/>
            </svg>
          </div>
          <span className="text-[16px] font-medium text-[#2C2C2A]">PainPath</span>
        </div>

        {/* Card */}
        <div className="bg-white border border-black/[0.1] rounded-2xl p-6 shadow-sm text-center">

          {/* Icon */}
          <div className="w-12 h-12 rounded-full bg-[#FCEBEB] flex items-center justify-center mx-auto mb-4">
            {isNetworkError ? (
              /* Wifi off icon */
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
                <path d="M2 2l20 20M8.5 8.5A7.5 7.5 0 0115.5 7M5 12.5A10 10 0 0112 10m0 0a10 10 0 017 2.5M12 16h.01M3 3l1.5 1.5" stroke="#A32D2D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              /* Alert icon */
              <svg viewBox="0 0 20 20" fill="none" className="w-6 h-6">
                <path d="M10 6v4m0 4h.01M10 2a8 8 0 100 16A8 8 0 0010 2z" stroke="#A32D2D" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            )}
          </div>

          {/* Title */}
          <div className="text-[15px] font-medium text-[#2C2C2A] mb-2">
            {isNetworkError ? "Connection problem" : "Something went wrong"}
          </div>

          {/* Message */}
          <div className="text-[12px] text-[#888780] leading-relaxed mb-5">
            {isNetworkError
              ? "Unable to reach the server. Check your internet connection and try again."
              : "An unexpected error occurred. If this keeps happening, contact your system administrator."}
          </div>

          {/* Error detail — collapsed, for debugging */}
          <details className="text-left mb-5">
            <summary className="text-[11px] text-[#B4B2A9] cursor-pointer hover:text-[#888780] transition-colors">
              Show error detail
            </summary>
            <div className="mt-2 px-3 py-2 bg-[#F1EFE8] rounded-lg text-[11px] text-[#888780] font-mono break-all leading-relaxed">
              {error.message || "Unknown error"}
              {error.digest && (
                <span className="block mt-1 text-[#B4B2A9]">ID: {error.digest}</span>
              )}
            </div>
          </details>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <button
              onClick={reset}
              className="w-full py-[10px] rounded-lg bg-[#0F6E56] text-[#E1F5EE] text-[13px] font-medium hover:bg-[#085041] transition-colors"
            >
              Try again
            </button>
            {/* <button
              onClick={() => router.push("/patients")}
              className="w-full py-[10px] rounded-lg text-[13px] text-[#2C2C2A] border border-black/[0.12] hover:bg-[#D3D1C7] transition-colors"
              style={{ background: "#F1EFE8" }}
            >
              Back to patients
            </button> */}
          </div>
        </div>

        <p className="text-center text-[11px] text-[#B4B2A9] mt-5">
          PainPath Physio Portal · NHS Belfast
        </p>
      </div>
    </div>
  );
}