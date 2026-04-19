# Screening Flow — End to End

## User Journey

1. Recruiter logs in
2. Creates a job (title, company, skills, experience, requirements)
3. Uploads a candidate file (CSV, Excel, or PDF) during job creation or anytime from the job detail page
4. Navigates to the job detail page
5. Clicks "Screen Candidates"
6. AI processes all candidates → scores, ranks, explains
7. Ranked shortlist appears in the sidebar with expandable details

## Backend Flow (Next.js API routes + server actions)

```
POST /api/jobs/{id}/upload-talents
  → Receive multipart form file
  → Parse:
      PDF  → LlamaParse (@ llama-parse) → markdown text + email
      CSV  → PapaParse → structured rows
      XLSX → xlsx → structured rows
  → Store each candidate in MongoDB `candidates` collection
  → Return: count of candidates parsed

POST /api/jobs/{id}/screen (or screenCandidatesAction server action)
  → Fetch job from `jobs` collection
  → Fetch all candidates from `candidates` collection for this job
  → Build prompt: job description + all candidate data
  → ONE Gemini API call (via @google/genai):
      - Extract structured info from raw resume text
      - Score each candidate across 6 weighted categories
      - Rank by weighted average
      - Generate strengths, gaps, recommendation
  → Update each candidate doc with screening results
  → Set job status to "done"
  → Return: summary

GET /api/jobs/{id}/candidates
  → Return candidates sorted by screening rank
```

## Frontend Components

| Component | File | Role |
|---|---|---|
| Job Detail Page | `app/dashboard/jobs/[id]/page.tsx` | Shows job info + candidate sidebar + screen button |
| Screen Button | `app/ui/jobs/screen-button.tsx` | Triggers `screenCandidatesAction`, shows loading/result |
| Upload Candidates | `app/ui/jobs/upload-candidates.tsx` | Drag-drop multi-file upload to `/api/jobs/{id}/upload-talents` |
| Talent Sidebar | `app/ui/jobs/talent-sidebar.tsx` | Displays ranked candidates with score bars, strengths, gaps |
| Server Actions | `app/lib/actions.ts` | `createJobAction`, `updateJobAction`, `screenCandidatesAction` |
| Data Fetching | `app/lib/data.ts` | MongoDB queries for jobs, candidates, results |

## Services

| Service | File | Responsibility |
|---|---|---|
| `auth.ts` | `app/lib/services/auth.ts` | bcrypt verify for login |
| `spreadsheet-parser.ts` | `app/lib/services/spreadsheet-parser.ts` | CSV/Excel parsing + column auto-map |
| `pdf-parser.ts` | `app/lib/services/pdf-parser.ts` | LlamaParse integration |
| `file-parser.ts` | `app/lib/services/file-parser.ts` | Routes file to the right parser |
| `screening.ts` | `app/lib/services/screening.ts` | Gemini prompt, scoring, ranking |

## MongoDB Collections

- `users` — recruiter accounts (username, email, hashed_password)
- `jobs` — job postings (role, company, skills, experience, requirements, status)
- `candidates` — parsed applicant data + screening results (linked by job_id)

## Candidate Document Shape

```
{
  job_id: string
  name: string
  email: string | null
  phone: string | null
  skills: string[]
  experience_years: number | null
  experience_details: string[]
  education: string[]
  summary: string | null
  raw_resume_text: string | null     // markdown from PDF
  screening: {                        // null until screened
    rank: number
    final_score: number
    scores: {
      work_experience, skills_match, projects_portfolio,
      education, certifications, other
    }
    strengths: string[]
    gaps: string[]
    recommendation: string
  } | null
  created_at: string
}
```
