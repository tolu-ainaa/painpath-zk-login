// The verifier panel.
//
// Shot 3 of the demo: open the server's entire storage and show there is
// nothing in it worth stealing. Deliberately unauthenticated — a panel that
// proves the server holds no credentials is worth nothing if you have to take
// its word for it.
"use client";

import { useEffect, useState } from "react";

type VerifierData = {
  claim: string;
  credentialStorage: {
    passwordHashes: number;
    passwordSalts: number;
    apiKeys: number;
    clinicianSecrets: number;
    note: string;
  };
  cookies: { name: string; value: string; note?: string }[];
  environment: {
    variableNames: string[];
    secretShapedNames: string[];
    secretShapedCount: number;
    note: string;
  };
  clinicalData: {
    sessionCount: number;
    note: string;
    sessions: {
      sessionId: string;
      patientId: string;
      status: string;
      submittedAt: string;
      painZones: number;
    }[];
  };
  filesOnDisk: { file: string; bytes: number; contents: unknown }[];
  generatedAt: string;
};

export default function VerifierPage() {
  const [data, setData] = useState<VerifierData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/verifier", { cache: "no-store" })
      .then((r) => r.json())
      .then(setData)
      .catch((e) => setError(String(e)));
  }, []);

  return (
    <div className="min-h-screen p-6" style={{ background: "#F1EFE8" }}>
      <div className="max-w-4xl mx-auto">
        <header className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-[#0F6E56] flex items-center justify-center">
              <svg viewBox="0 0 20 20" fill="none" className="w-3.5 h-3.5">
                <path
                  d="M10 3C10 3 4 7 4 12a6 6 0 0012 0C16 7 10 3 10 3z"
                  fill="white"
                  opacity="0.9"
                />
                <circle cx="10" cy="12" r="2" fill="white" />
              </svg>
            </div>
            <span className="text-[16px] font-semibold text-[#2C2C2A]">
              PainPath
            </span>
            <span className="text-[10px] font-medium px-2 py-[2px] rounded-full bg-[#EEEDFE] text-[#3C3489]">
              Verifier panel
            </span>
          </div>
          <h1 className="text-[22px] font-semibold text-[#2C2C2A] leading-tight">
            Everything this server stores
          </h1>
          {data && (
            <p className="text-[13px] text-[#888780] mt-1 max-w-2xl leading-[1.5]">
              {data.claim}
            </p>
          )}
        </header>

        {error && (
          <div className="bg-[#FCEBEB] text-[#A32D2D] rounded-xl p-4 text-[13px]">
            {error}
          </div>
        )}

        {!data && !error && (
          <div className="text-[13px] text-[#888780]">Reading server state…</div>
        )}

        {data && (
          <>
            {/* The headline numbers. */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-5">
              <Stat n={data.credentialStorage.passwordHashes} label="Password hashes" />
              <Stat n={data.credentialStorage.passwordSalts} label="Password salts" />
              <Stat n={data.credentialStorage.clinicianSecrets} label="Clinician secrets" />
              <Stat n={data.environment.secretShapedCount} label="Secrets in env" />
            </div>

            <p className="text-[12px] text-[#888780] mb-6 leading-[1.5]">
              {data.credentialStorage.note}
            </p>

            <Section title="Cookies presented by this browser">
              {data.cookies.length === 0 ? (
                <Empty>No cookies set.</Empty>
              ) : (
                data.cookies.map((c) => (
                  <div key={c.name} className="mb-2 last:mb-0">
                    <Mono label={c.name} value={c.value} />
                    {c.note && (
                      <p className="text-[11px] text-[#888780] mt-1">{c.note}</p>
                    )}
                  </div>
                ))
              )}
            </Section>

            <Section title="Environment variables">
              <p className="text-[12px] text-[#888780] mb-2">
                {data.environment.note}
              </p>
              <div className="text-[11px] font-mono text-[#2C2C2A] break-all">
                {data.environment.variableNames.length === 0
                  ? "—"
                  : data.environment.variableNames.join("  ·  ")}
              </div>
              {data.environment.secretShapedCount > 0 && (
                <p className="text-[12px] text-[#A32D2D] mt-2">
                  Secret-shaped names present:{" "}
                  {data.environment.secretShapedNames.join(", ")}
                </p>
              )}
            </Section>

            <Section title={`Clinical data (${data.clinicalData.sessionCount} sessions)`}>
              <p className="text-[12px] text-[#888780] mb-3 leading-[1.5]">
                {data.clinicalData.note}
              </p>
              <div className="flex flex-col gap-1">
                {data.clinicalData.sessions.map((s) => (
                  <div
                    key={s.sessionId}
                    className="flex items-center justify-between text-[12px] px-3 py-2 rounded-lg bg-[#F1EFE8]"
                  >
                    <span className="font-mono text-[#2C2C2A]">{s.patientId}</span>
                    <span className="text-[#888780]">
                      {s.painZones} zones · {s.status}
                    </span>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Every file on disk">
              {data.filesOnDisk.length === 0 ? (
                <Empty>No files.</Empty>
              ) : (
                data.filesOnDisk.map((f) => (
                  <details key={f.file} className="mb-2 last:mb-0">
                    <summary className="cursor-pointer text-[12px] font-mono text-[#0F6E56]">
                      {f.file} · {(f.bytes / 1024).toFixed(1)} KB
                    </summary>
                    <pre className="mt-2 p-3 rounded-lg bg-[#2C2C2A] text-[#E1F5EE] text-[10px] overflow-x-auto max-h-80">
                      {JSON.stringify(f.contents, null, 2)}
                    </pre>
                  </details>
                ))
              )}
            </Section>

            <p className="text-[11px] text-[#B4B2A9] mt-6">
              Generated {new Date(data.generatedAt).toLocaleString()} · reload to
              re-read
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  const good = n === 0;
  return (
    <div
      className={`rounded-xl px-4 py-3 ${good ? "bg-[#E1F5EE]" : "bg-[#FCEBEB]"}`}
    >
      <div
        className={`text-[28px] font-medium leading-none ${
          good ? "text-[#0F6E56]" : "text-[#A32D2D]"
        }`}
      >
        {n}
      </div>
      <div className="text-[11px] text-[#888780] mt-[6px]">{label}</div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white border border-black/[0.1] rounded-xl p-4 mb-3">
      <h2 className="text-[10px] font-medium text-[#888780] uppercase tracking-[0.05em] mb-3">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Mono({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-[12px] font-mono break-all">
      <span className="text-[#888780]">{label}</span>{" "}
      <span className="text-[#2C2C2A]">= {value || "(empty)"}</span>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="text-[12px] text-[#B4B2A9]">{children}</div>;
}
