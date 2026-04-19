# Backlog — Task Breakdown (Reorganized)

## Issues with Original List
- Duplicates: "Job and application processing" and "Job & applicant processing" are the same
- Overlaps: "Create database", "create db backend", "db schema" can be consolidated
- "AI model" is too vague — needs splitting into distinct AI tasks
- Missing critical tasks: resume/file parsing, file upload, shortlist UI, prompt engineering, testing, deployment, documentation, dummy data generation
- No logical ordering or phasing

---

## Phase 0 — Foundation & Planning

### 0.1 Architecture Design
Define the full system architecture: frontend, backend, AI layer, database, and how they communicate. Produce a finalized architecture diagram and document tech stack decisions.

### 0.2 Database Schema Design
Design schemas for all collections/tables: Jobs, Applicants, Screening Results, Users. Define relationships, indexes, and data validation rules. Include the Umurava Talent Profile Schema mapping.

### 0.3 Deployment Strategy
Choose hosting providers for frontend, backend, database, and AI layer. Set up CI/CD pipeline, environment variable management, and staging/production environments.

---

## Phase 1 — Backend Core

### 1.1 Project Setup & Boilerplate
Initialize backend project with chosen framework, folder structure, linting, environment config, and dependency management.

### 1.2 Database Setup & Connection
Set up the database instance, implement connection logic, and create all collections/tables based on the schema design (Phase 0.2).

### 1.3 Authentication System (Register / Login)
Implement user registration, login, session/token management, and route protection. Recruiters must be able to create accounts and securely log in.

### 1.4 Job CRUD API
Build REST endpoints for creating, reading, updating, and deleting job postings. Include fields: role title, description, required skills, experience level, education, and any custom criteria.

### 1.5 Applicant Ingestion API — Structured Profiles (Scenario 1)
Build endpoints to receive and store structured talent profiles following the Umurava schema. Support bulk ingestion of multiple applicants per job.

### 1.6 Applicant Ingestion API — File Uploads (Scenario 2)
Build endpoints for uploading CSV/Excel spreadsheets and PDF resumes. Handle file storage and trigger parsing pipeline.

### 1.7 Resume & Spreadsheet Parsing
Implement parsing logic to extract candidate data from uploaded PDFs (resumes) and CSV/Excel files. Normalize parsed data into the same internal applicant format used by Scenario 1.

### 1.8 Backend Security
Implement input validation/sanitization, rate limiting, CORS policies, secure headers, error handling that doesn't leak internals, and environment variable protection.

---

## Phase 2 — AI Layer

### 2.1 AI Integration Setup
Set up the LLM API client, configure API keys, implement request/response handling, error handling, and retry logic.

### 2.2 Prompt Engineering & Documentation
Design, test, and document all prompts used for candidate screening. Include system prompts, job context injection, and candidate data formatting. Document reasoning behind prompt choices.

### 2.3 Job-to-Candidate Matching
Implement the core matching logic: send job requirements + candidate profiles to the LLM, receive structured compatibility analysis. Handle multi-candidate evaluation in batches.

### 2.4 Candidate Scoring & Ranking
Implement weighted scoring system (skills, experience, education, relevance). Produce a 0–100 match score per candidate. Sort and select Top 10 or Top 20.

### 2.5 Natural-Language Reasoning Generation
For each shortlisted candidate, generate a recruiter-friendly explanation: strengths, gaps/risks, and a final recommendation. Output must be structured and consistent.

### 2.6 Screening Orchestration
Build the end-to-end screening pipeline: receive trigger → gather job + applicant data → send to AI → process results → store ranked shortlist in database. Handle edge cases (too few applicants, API failures, timeouts).

---

## Phase 3 — Frontend

### 3.1 Project Setup & Layout
Initialize frontend project, configure routing, global layout, navigation, and styling system.

### 3.2 Authentication Pages (Login / Register)
Build login and registration forms with validation, error handling, and redirect logic. Connect to backend auth endpoints.

### 3.3 Recruiter Dashboard
Main landing page after login. Show summary of jobs, recent screenings, and quick actions. This is the recruiter's home base.

### 3.4 Job Creation & Editing Forms
Build forms for creating and editing job postings with all required fields (title, description, skills, experience, education, criteria). Include form validation.

### 3.5 Applicant Upload Interface
Build the interface for both scenarios:
- Scenario 1: View/manage structured talent profiles linked to a job
- Scenario 2: File upload (drag-and-drop or click) for CSV/Excel/PDF with upload progress and status

### 3.6 AI Screening Trigger & Progress
Add a "Screen Applicants" action on a job. Show processing status/loading state while AI screening runs. Handle success and error states.

### 3.7 Shortlist Visualization
Display the ranked Top 10/20 candidates with: rank position, match score (0–100), and a summary. Support sorting/filtering. Make it visually clear and recruiter-friendly.

### 3.8 Candidate Detail — AI Reasoning View
Expandable or detail view per candidate showing full AI-generated explanation: strengths, gaps/risks, final recommendation. This is where AI transparency is demonstrated.

---

## Phase 4 — Integration & Polish

### 4.1 End-to-End Integration Testing
Test the full flow: create job → upload applicants → trigger screening → view shortlist → view candidate reasoning. Cover both Scenario 1 and Scenario 2.

### 4.2 Dummy Data Generation
Generate realistic test data: sample jobs, structured talent profiles (per Umurava schema), sample resumes/CSVs. Ensure enough volume to demonstrate Top 10/20 shortlisting.

### 4.3 UI/UX Polish & Responsiveness
Refine the interface for clarity, consistency, and responsiveness. Ensure the app looks professional and is usable on different screen sizes.

### 4.4 Error Handling & Edge Cases
Handle and display graceful errors across the app: API failures, invalid uploads, empty results, malformed data, AI timeouts.

---

## Phase 5 — Deployment & Documentation

### 5.1 Production Deployment
Deploy frontend, backend, and database to chosen providers. Configure environment variables, domains, and HTTPS. Verify the live URL works end-to-end.

### 5.2 README & Technical Documentation
Write the README with: project overview, architecture diagram, setup instructions, environment variables, AI decision flow explanation, assumptions and limitations.

### 5.3 Presentation Slides (2 Slides)
Create the required Google Slides / PowerPoint: product overview, key features, architecture, and demo highlights.

---

## Summary: Original → Reorganized Mapping

| Original Task | Mapped To |
|---|---|
| architecture design | 0.1 Architecture Design |
| db schema | 0.2 Database Schema Design |
| deployment selection | 0.3 Deployment Strategy |
| Create database / create db backend | 1.2 Database Setup & Connection |
| login page / register page / create account | 1.3 + 3.2 (backend + frontend) |
| Job and application processing / Job & applicant processing | 1.4 + 1.5 + 1.6 (split by concern) |
| Back-end security | 1.8 Backend Security |
| AI model | 2.1 AI Integration Setup |
| Job-to-candidate matching | 2.3 Job-to-Candidate Matching |
| Candidate scoring and ranking | 2.4 Candidate Scoring & Ranking |
| Natural-language reasoning generation | 2.5 Natural-Language Reasoning Generation |
| front-end design | 3.1 through 3.8 (split into specific UI tasks) |

**New tasks added:** Resume parsing (1.7), Prompt engineering (2.2), Screening orchestration (2.6), Dashboard (3.3), Shortlist visualization (3.7), Candidate detail view (3.8), Integration testing (4.1), Dummy data (4.2), UI polish (4.3), Error handling (4.4), Documentation (5.2), Slides (5.3)
