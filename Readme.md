# PainPath — Physio Portal

The clinician-facing web dashboard for the PainPath AR pain assessment platform. Physiotherapists use this portal to review patient pain sessions captured via Meta Quest 3, examine AI-generated exercise plans, edit recommendations, and approve plans which are then delivered back to the patient's headset.

---

## How it fits into PainPath

```
Quest 3 (Unity)
    │
    │  POST /api/sessions  (pain zone JSON)
    ▼
Physio Portal (Next.js)  ←── this repo
    ├── Saves session to Firestore
    ├── Sends pain data to Gemini AI
    ├── Stores AI exercise plan to Firestore
    └── Physio reviews → approves → plan sent back to Quest 3
```

---

## Features

- **Patient list** — view all sessions with pending/approved status tabs
- **Pain heatmap** — visual SVG body map with colour-coded pain zones (sharp / ache / stiff)
- **AI assessment** — Gemini-powered condition matching and exercise plan generation
- **Inline plan editing** — physio can modify, add or remove exercises before approving
- **One-click approval** — approved plans sync to Firestore for the Quest 3 to poll
- **Auth** — cookie-based login with middleware route protection
- **Error handling** — branded error pages replacing Next.js default overlays
- **Loading skeletons** — skeleton screens on all data-fetching routes

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Styling | Tailwind CSS |
| Database | Firebase Firestore (via `firebase-admin`) |
| AI | Google Gemini 3.1 Flash Lite Preview |
| Deployment | Vercel |
| Language | TypeScript |

---

## Project structure

```
physio-portal/
├── app/
│   ├── (app)/                        # Protected routes (require auth)
│   │   ├── page.tsx                  # Patient list page
│   │   ├── loading.tsx               # Skeleton for patient list
│   │   ├── patients/
│   │   │   └── [sessionId]/
│   │   │       ├── page.tsx          # Individual patient portal
│   │   │       ├── loading.tsx       # Skeleton for patient portal
│   │   │       └── layout.tsx
│   │   └── api/
│   │       └── sessions/
│   │           ├── route.ts          # GET all / POST new session
│   │           └── [id]/
│   │               ├── route.ts      # GET single session
│   │               ├── approve/
│   │               │   └── route.ts  # PATCH — approve session
│   │               └── edit-plan/
│   │                   └── route.ts  # PATCH — save edited exercise plan
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx              # Login page
│   ├── error.tsx                     # Route-level error boundary
│   ├── global-error.tsx              # Root layout error boundary
│   ├── globals.css                   # Tailwind directives
│   └── layout.tsx                    # Root layout
│
├── components/
│   ├── PatientsPageContainer.tsx     # Patient list + tabs
│   ├── PatientPageContainer.tsx      # Full portal layout
│   ├── StatRow.tsx                   # Pending / approved / total stats
│   ├── HeatCard.tsx                  # Pain heatmap SVG component
│   ├── AiAssessment.tsx              # AI condition + exercises display
│   ├── ActionBtns.tsx                # Edit plan / Approve buttons
│   ├── PatientCard.tsx
│   └── Navbar.tsx                    # Global navbar
│
├── lib/
│   ├── firebaseAdmin.ts              # Firebase Admin SDK initialisation
│   ├── mapToRegion.ts                # Pain zone processing + SVG mapping
│   ├── api/
│   │   └── session.ts                # fetchSessions() client helper
│   └── ai/
│       ├── analyzePain.ts            # Gemini API call + retry logic
│       └── buildPainSummary.ts       # Structures pain data for AI prompt
│
├── types/
│   └── index.ts                      # Shared TypeScript types
│
├── proxy.ts                          # Next.js middleware (auth guard)
├── next.config.mjs
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

---

## Getting started

### Prerequisites

- Node.js 18+
- A Firebase project with Firestore enabled
- A Google AI Studio API key (Gemini)

### 1. Clone and install

```bash
git clone https://github.com/your-org/PainPath.git
cd PainPath/physio-portal
npm install
```

### 2. Set up environment variables

Create a `.env.local` file in the `physio-portal/` directory:

```env
# App
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000

# Firebase Admin (from your Firebase service account)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# AI
GEMINI_API_KEY=your_gemini_api_key
```

To get Firebase credentials:
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click **Generate new private key**
3. Copy `project_id`, `client_email`, and `private_key` into `.env.local`

### 3. Run locally

```bash
npm run dev
```

Visit `http://localhost:3000` — the middleware will redirect you to `/login`.

---

## API routes

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/sessions` | Returns all sessions from Firestore |
| `POST` | `/api/sessions` | Receives Unity pain JSON, runs AI analysis, saves to Firestore |
| `GET` | `/api/sessions/[id]` | Returns a single session by ID |
| `PATCH` | `/api/sessions/[id]/approve` | Marks session as approved |
| `PATCH` | `/api/sessions/[id]/edit-plan` | Saves physio-edited exercise plan |

### Expected POST `/api/sessions` payload (from Unity)

```json
{
  "sessionId": "8c2f4d1e-9b3a-4e7f-a1c2-7d8e9f0a1b2c",
  "patientId": "123456",
  "submittedAt": "2026-04-25T14:32:18.452Z",
  "deviceType": "MetaQuest3",
  "sessionSummary": {
    "totalZones": 3,
    "dominantPainType": "sharp",
    "maxIntensity": 10,
    "averageIntensity": 7.33,
    "durationSeconds": 47.8
  },
  "painZones": [
    {
      "zoneId": "zone_lower_back",
      "bodyPart": "lower_back",
      "uvX": 0.5012,
      "uvY": 0.6824,
      "worldPosition": { "x": -0.018, "y": 1.012, "z": -0.094 },
      "painType": "sharp",
      "intensity": 8,
      "timestamp": "2026-04-25T14:32:01.582Z"
    }
  ]
}
```

---

## Deployment (Vercel)

1. Connect your GitHub repository to Vercel
2. Set **Root Directory** to `physio-portal`
3. Add all environment variables from `.env.local` in Vercel project settings
4. Deploy — subsequent pushes to `main` redeploy automatically

After first deploy, update `NEXT_PUBLIC_API_BASE_URL` to your live Vercel URL.

---

## AI integration

Pain zones are processed and sent to **Gemini 2.0 Flash** with a structured prompt. The model returns a JSON object containing a condition match, confidence score, clinical reasoning, exercise plan, and red flags — all reviewed by the physiotherapist before being approved and sent to the patient.

Includes automatic retry logic (up to 3 attempts with exponential backoff) to handle Gemini 503 overload errors gracefully.

---

## Related

- [`/unity`](../unity) — Meta Quest 3 AR pain mapping application
- [Firebase Console](https://console.firebase.google.com) — Firestore database
- [Vercel Dashboard](https://vercel.com) — deployment and logs