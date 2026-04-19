# Umurava Hackathon — AI Talent Screening

https://competence.umurava.africa/challenges/69ca12dc82d1c3e042ec8f0d

AI-powered talent screening tool that parses resumes and spreadsheets, scores candidates across 6 weighted categories using Gemini, and produces a ranked shortlist with explanations.

## Tech Stack

- **Full-stack:** Next.js 16 (App Router, TypeScript) — UI, API routes, and server actions in one codebase
- **Database:** MongoDB
- **Auth:** NextAuth.js + bcrypt
- **AI:** Google Gemini (`@google/genai`)
- **Parsing:** LlamaParse (PDF), PapaParse (CSV), xlsx (Excel)
- **Styling:** Tailwind CSS

## Prerequisites

- Node.js v20+
- pnpm
- MongoDB (local or Atlas)
- Gemini API key ([Google AI Studio](https://aistudio.google.com/apikey))
- LlamaCloud API key ([LlamaCloud](https://cloud.llamaindex.ai))

## Setup

```bash
pnpm install
cp .env.example .env.local   # then fill in your keys
pnpm dev
```

Visit http://localhost:3000.

### Environment variables

```
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=umurava_hackathon_db
GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL=gemini-2.5-flash
LLAMA_CLOUD_API_KEY=your_llama_cloud_key
MAX_UPLOAD_SIZE_MB=10
AUTH_SECRET=$(openssl rand -base64 32)
```

## Usage

1. Register at `/auth/register`
2. Log in at `/auth/login`
3. Create a job (role, company, required skills, experience, description)
4. Open the job detail page
5. Upload candidate files (CSV / Excel / PDF) — parsed and stored automatically
6. Click **Screen Candidates** — one Gemini call scores and ranks everyone
7. View ranked shortlist with score breakdown, strengths, gaps, and recommendation

## Project Structure

```
.
├── app/
│   ├── api/                  # API route handlers
│   │   ├── users/            # register, login, get user
│   │   └── jobs/             # CRUD + upload + screen + candidates
│   ├── auth/                 # login / register pages
│   ├── dashboard/            # recruiter dashboard, job views, results
│   ├── lib/
│   │   ├── db/mongodb.ts     # cached MongoDB client
│   │   ├── schemas/          # Zod + TypeScript types
│   │   ├── services/         # parsing + screening business logic
│   │   ├── actions.ts        # server actions for forms
│   │   └── data.ts           # read-side data fetching
│   └── ui/                   # UI components
├── auth.ts                   # NextAuth config
└── auth.config.ts
```

## Scoring Weights

| Category | Weight |
|---|---|
| Work Experience | 30% |
| Skills Match | 25% |
| Projects & Portfolio | 15% |
| Education | 12% |
| Certifications | 10% |
| Other (extracurriculars, leadership) | 8% |

See [`docs/scoring_weights.md`](docs/scoring_weights.md) for details.

## Screening Flow

```
Create Job → Upload files (CSV/PDF) → Click "Screen Candidates"
   ↓
LlamaParse / PapaParse / xlsx → parsed candidates in MongoDB
   ↓
ONE Gemini call with job + all candidates
   ↓
Scored, ranked, explained → shown in sidebar
```

See [`docs/screening_flow.md`](docs/screening_flow.md) for the full flow.

## Checks

```bash
pnpm exec tsc --noEmit    # typecheck
```
