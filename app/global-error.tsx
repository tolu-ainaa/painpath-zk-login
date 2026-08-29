"use client";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[PainPath global error]", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: "#F1EFE8", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ width: "100%", maxWidth: 360, textAlign: "center" }}>

            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 32 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "#0F6E56", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg viewBox="0 0 20 20" fill="none" style={{ width: 14, height: 14 }}>
                  <path d="M10 3C10 3 4 7 4 12a6 6 0 0012 0C16 7 10 3 10 3z" fill="white" opacity="0.9"/>
                  <circle cx="10" cy="12" r="2" fill="white"/>
                </svg>
              </div>
              <span style={{ fontSize: 16, fontWeight: 500, color: "#2C2C2A" }}>PainPath</span>
            </div>

            {/* Card */}
            <div style={{ background: "#fff", border: "0.5px solid rgba(0,0,0,0.1)", borderRadius: 16, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#FCEBEB", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <svg viewBox="0 0 20 20" fill="none" style={{ width: 24, height: 24 }}>
                  <path d="M10 6v4m0 4h.01M10 2a8 8 0 100 16A8 8 0 0010 2z" stroke="#A32D2D" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>

              <div style={{ fontSize: 15, fontWeight: 500, color: "#2C2C2A", marginBottom: 8 }}>
                Application error
              </div>
              <div style={{ fontSize: 12, color: "#888780", lineHeight: 1.6, marginBottom: 20 }}>
                A critical error prevented the portal from loading. Please refresh the page or contact your system administrator if it persists.
              </div>

              {/* Error detail */}
              <details style={{ textAlign: "left", marginBottom: 20 }}>
                <summary style={{ fontSize: 11, color: "#B4B2A9", cursor: "pointer" }}>
                  Show error detail
                </summary>
                <div style={{ marginTop: 8, padding: "8px 12px", background: "#F1EFE8", borderRadius: 8, fontSize: 11, color: "#888780", fontFamily: "monospace", wordBreak: "break-all", lineHeight: 1.5 }}>
                  {error.message || "Unknown error"}
                  {error.digest && <div style={{ marginTop: 4, color: "#B4B2A9" }}>ID: {error.digest}</div>}
                </div>
              </details>

              <button
                onClick={reset}
                style={{ width: "100%", padding: "10px 0", borderRadius: 8, background: "#0F6E56", color: "#E1F5EE", fontSize: 13, fontWeight: 500, border: "none", cursor: "pointer" }}
              >
                Reload portal
              </button>
            </div>

            <p style={{ fontSize: 11, color: "#B4B2A9", marginTop: 20 }}>
              PainPath Physio Portal · NHS Belfast
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}