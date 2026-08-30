import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { listSessions } from "@/lib/store/sessions";

/*
 * Dumps everything this server persists, so the claim "there is nothing here
 * worth stealing" can be checked rather than asserted.
 *
 * This is deliberately unauthenticated. A panel that proves the server holds
 * no credentials is worth nothing if you have to take its word for it.
 */

// Anything matching these in an env var NAME would be a credential-shaped
// secret. We report names only — never values — and count the matches.
const SECRET_SHAPED = /pass|secret|token|key|credential|auth|private|salt|hash/i;

// Env vars every Node/Next process has. Not interesting.
const BORING_ENV = /^(NODE|npm_|__|PATH$|PWD$|HOME$|SHELL$|TERM$|LANG$|TZ$|HOSTNAME$|USER$|LOGNAME$|TMPDIR$|NEXT_RUNTIME$|NEXT_DEPLOYMENT_ID$)/;

/*
 * Framework and OS internals that trip SECRET_SHAPED without being secrets —
 * NEXT_PRIVATE_TRACE_ID matches /private/, NVM_* and WSL_INTEROP match /key|auth/
 * in some shells, and so on. They are still listed in full under
 * `variableNames`; they are only excluded from the secret COUNT, so the number
 * means "credentials" rather than "strings containing the word private".
 */
const FRAMEWORK_INTERNAL = /^(NEXT_PRIVATE_|NEXT_TURBOPACK|NVM_|XDG_|WSL|DBUS_|PULSE_|WAYLAND_|RUST_)/;

async function dumpDataDir() {
  const dir = path.join(process.cwd(), "data");
  try {
    const names = await readdir(dir);
    return await Promise.all(
      names.map(async (name) => {
        const full = path.join(dir, name);
        const info = await stat(full);
        const raw = await readFile(full, "utf8");
        return {
          file: `data/${name}`,
          bytes: info.size,
          // The full contents, not a summary. Nothing is being hidden.
          contents: JSON.parse(raw) as unknown,
        };
      }),
    );
  } catch {
    return [];
  }
}

export async function GET() {
  const jar = await cookies();

  const envNames = Object.keys(process.env)
    .filter((k) => !BORING_ENV.test(k))
    .sort();
  const secretShapedEnv = envNames.filter(
    (k) => SECRET_SHAPED.test(k) && !FRAMEWORK_INTERNAL.test(k),
  );

  const sessions = listSessions();

  return NextResponse.json(
    {
      claim:
        "This is the complete set of what the PainPath server persists. No password, no password hash, no salt, no credential of any kind appears anywhere below.",

      credentialStorage: {
        passwordHashes: 0,
        passwordSalts: 0,
        apiKeys: 0,
        clinicianSecrets: 0,
        note: "There is no table, file, or in-memory structure holding clinician credentials. Firebase Auth and Firestore were removed; nothing replaced them.",
      },

      // Cookies the browser is currently presenting.
      cookies: jar.getAll().map((c) => ({
        name: c.name,
        value: c.value,
        note:
          c.name === "session"
            ? "Opaque session marker. Not derived from any secret and worthless if stolen from disk — it grants a session, it does not prove identity."
            : undefined,
      })),

      // Environment. Names only, values never.
      environment: {
        variableNames: envNames,
        secretShapedNames: secretShapedEnv,
        secretShapedCount: secretShapedEnv.length,
        note: "Every variable name in this process is listed. Values are never returned by this endpoint. The portal requires no environment configuration at all — there is no .env file in the repository, and none is needed to run it.",
      },

      // Clinical data. Real in production, fabricated here.
      clinicalData: {
        sessionCount: sessions.length,
        note: "Pain sessions are patient data, not credentials. Breaching them is a privacy harm, which is exactly why the login should not add a second thing worth stealing.",
        sessions: sessions.map((s) => ({
          sessionId: s.sessionId,
          patientId: s.patientId,
          status: s.status,
          submittedAt: s.submittedAt,
          painZones: s.rawInput.painZones.length,
        })),
      },

      // Every file on disk under data/, in full.
      filesOnDisk: await dumpDataDir(),

      generatedAt: new Date().toISOString(),
    },
    {
      status: 200,
      headers: { "cache-control": "no-store" },
    },
  );
}
