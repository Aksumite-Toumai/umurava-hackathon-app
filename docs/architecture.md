# System Architecture — AI Talent Screening Tool

## 1. System Overview

A recruiter-facing Next.js application that uses AI to screen, score, rank, and explain candidate-job fit. The system supports two intake scenarios that converge into a single AI screening pipeline, all in a single TypeScript codebase.

```
┌─────────────────────────────────────────────────────────────┐
│                        RECRUITER                            │
└──────────────────────────┬──────────────────────────────────┘
                           │ Browser
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                Next.js App (single deployment)               │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  UI (React Server/Client Components, Tailwind)      │   │
│  │  - Auth pages, dashboard, job mgmt, upload, results │   │
│  └───────────────────────┬─────────────────────────────┘   │
│                          │                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Server Actions & API Routes (app/api/)             │   │
│  │  - Auth, jobs CRUD, upload, screen                  │   │
│  └───────────────────────┬─────────────────────────────┘   │
│                          │                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Services (app/lib/services/)                        │   │
│  │  - File parser (PDF/CSV/Excel)                      │   │
│  │  - Screening (Gemini)                                │   │
│  └───────────────────────┬─────────────────────────────┘   │
└────────────┬─────────────┼──────────────────────────────────┘
             │             │
             │             ▼
             │   ┌───────────────────┐     ┌──────────────────┐
             │   │    Gemini API     │     │   LlamaParse     │
             │   │  (@google/genai)  │     │  (llama-parse)   │
             │   └───────────────────┘     └──────────────────┘
             │
             │ Mongo driver
             ▼
┌─────────────────────────────────────────────────────────────┐
│                      MongoDB                                 │
│                                                             │
│  Users  │  Jobs  │  Candidates (with screening results)    │
└─────────────────────────────────────────────────────────────┘
```

## 2. Component Breakdown

### Frontend (UI Layer)

| Component | Purpose |
|---|---|
| Auth Pages | Login, registration |
| Dashboard | Overview, job list |
| Job Management | Create / edit / view / delete jobs |
| Upload Candidates | Drag-drop multi-file upload (PDF/CSV/XLSX) |
| Screen Button | Trigger AI screening |
| Talent Sidebar | Ranked candidates with score bars, strengths, gaps, recommendation |

### API Routes & Server Actions

| Endpoint / Action | Purpose |
|---|---|
| `POST /api/users/create` | Register recruiter |
| `POST /api/users/login` | Login (also used by NextAuth) |
| `POST /api/jobs/create` | Create job |
| `GET /api/jobs` | List jobs (filtered by user_id) |
| `GET/PUT/DELETE /api/jobs/[id]` | Single job ops |
| `POST /api/jobs/[id]/upload-talents` | Upload candidates file |
| `POST /api/jobs/[id]/screen` | Trigger screening |
| `GET /api/jobs/[id]/candidates` | Get ranked candidates |

Server actions are also used for form submissions: `createJobAction`, `updateJobAction`, `deleteJobAction`, `screenCandidatesAction`, `register`, `authenticate`.

### Services (Business Logic)

- `spreadsheet-parser.ts` — PapaParse for CSV, xlsx for Excel, with column auto-mapping
- `pdf-parser.ts` — LlamaParse → markdown + regex email extraction
- `file-parser.ts` — Routes file to the right parser
- `screening.ts` — Builds Gemini prompt, one-shot scoring + ranking + reasoning
- `auth.ts` — bcrypt password verification

### Database

| Collection | Key Fields |
|---|---|
| `users` | `_id`, `username`, `email`, `hashed_password`, `created_at` |
| `jobs` | `_id`, `user_id`, `role`, `company`, `skills`, `experience`, `requirements`, `status`, `created_at` |
| `candidates` | `_id`, `job_id`, `name`, `email`, `skills[]`, `experience_years`, `education[]`, `summary`, `raw_resume_text`, `screening{}`, `created_at` |

## 3. Data Flow

### Scenario 1 — Umurava Platform (Structured Profiles)

```
Recruiter creates Job
        ↓
Structured Talent Profiles → Validate against schema
        ↓
Stored in `candidates` collection
        ↓
Recruiter triggers "Screen"
        ↓
Backend gathers job + all candidates
        ↓
ONE Gemini call → JSON response (scores, reasoning)
        ↓
Screening results stored on candidate docs
        ↓
Ranked shortlist rendered
```

### Scenario 2 — External Job Boards (File Uploads)

```
Recruiter creates Job
        ↓
Uploads files (CSV / Excel / PDF)
        ↓
Parse & normalize:
  - CSV/Excel → row-by-row with auto column mapping
  - PDF → LlamaParse → markdown → stored as raw_resume_text
        ↓
Stored in `candidates` collection
        ↓
(Same screening pipeline as Scenario 1)
```

## 4. AI Pipeline

### Prompt Strategy (single Gemini call)

```
SYSTEM PROMPT
  - Role: expert recruiter AI
  - Scoring criteria + weights
  - Output schema (strict JSON)

JOB CONTEXT
  - Title, description, required skills
  - Experience level, education requirement

CANDIDATES
  - For each: name, email, structured fields (if any)
  - Raw resume markdown (if available)

INSTRUCTIONS
  - Extract + score 6 categories (0-100 each)
  - Compute weighted final score
  - Rank
  - Top N get: strengths, gaps, recommendation
```

### Scoring Weights (fixed, documented)

| Category | Weight |
|---|---|
| Work Experience | 30% |
| Skills Match | 25% |
| Projects & Portfolio | 15% |
| Education | 12% |
| Certifications | 10% |
| Other | 8% |

`final_score = Σ(category_score × weight)`

## 5. Key Design Decisions

| Decision | Rationale |
|---|---|
| Single Next.js codebase | Matches hackathon-encouraged stack; single deployment; shared types |
| Server actions for forms | Direct DB access, no API round-trip for mutations from UI |
| API routes for external clients | `/api/jobs/[id]/upload-talents` called from client components (drag-drop upload) |
| One Gemini call for extract+score+rank | Cheaper and faster than per-candidate calls; batch context helps ranking |
| Structured JSON output from Gemini | `responseMimeType: "application/json"` for reliable parsing |
| LlamaParse → markdown, not structured | Gemini extracts structured data at screening time in the same call |
| Email-based merge | When spreadsheet + PDF both uploaded, matched by email |
| Fixed scoring weights | Simpler for hackathon; future: configurable per job |

## 6. Deployment

```
┌─────────────────────┐     ┌──────────────────┐
│     Next.js App     │────▶│     MongoDB      │
│  (Vercel / Node)    │     │    (Atlas)       │
└──────────┬──────────┘     └──────────────────┘
           │
           ├───▶ Gemini API (external)
           └───▶ LlamaCloud (external)
```

Single deployment. Frontend, API, and business logic all served from one Next.js instance.
