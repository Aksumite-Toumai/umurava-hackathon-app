# Project Understanding — Umurava AI Hackathon

## Core Task
Build an **AI-powered talent profile screening tool** for recruiters that:
1. Understands job requirements and ideal candidate profiles
2. Analyzes multiple applicants at once
3. Produces a ranked shortlist (Top 10 or Top 20)
4. Clearly explains why each candidate was shortlisted (strengths, gaps, relevance)

## Two Screening Scenarios

### Scenario 1: Umurava Platform Applicants
- Input: Job details + structured talent profiles (schema provided by Umurava)
- Must follow the provided Talent Profile Schema
- AI output must be explainable per candidate

### Scenario 2: External Job Board Applicants
- Input: Manually entered job details + uploaded CSV/Excel/PDF resumes
- Freedom to design parsing, ingestion, matching, and scoring logic

## Functional Requirements (Recruiter-Facing)
- Job creation and editing
- Applicant ingestion (profiles or file uploads)
- Trigger AI-based screening
- View ranked shortlists
- View AI-generated reasoning per candidate

## AI Requirements
- Multi-candidate evaluation
- Weighted scoring (skills, experience, education, relevance)
- Natural-language explanation per shortlisted candidate
- Output format: Rank, Match Score (0–100), Strengths, Gaps/Risks, Final Recommendation

## Key Evaluation Criteria
- Practical relevance
- AI clarity and responsibility
- Engineering quality
- Product thinking
- Treated as if going live at scale

## Notes on Tech Stack
The hackathon doc suggests Next.js, Node/TS, Redux, Tailwind, MongoDB, Gemini API — but **we are NOT locked into these**. We'll choose the best tools for the job. Gemini API is listed as mandatory in the doc, but our stack decisions will be made based on what delivers the best product.

## Deliverables
- Deployed web application (live URL)
- Functional AI screening logic
- 2-slide presentation (Google Slides / PowerPoint)
- Clear recruiter-facing interface
- Technical documentation (README with architecture, setup, AI decision flow, assumptions)
