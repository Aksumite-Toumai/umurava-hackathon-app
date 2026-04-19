# Merge Analysis: fbl + ftbm + Talent Profile Schema

## What each branch has

### fbl (our branch)
- File upload endpoint (PDF/CSV/Excel)
- LlamaParse PDF parsing -> markdown
- Pandas CSV/Excel parsing with auto column mapping
- Email-based merge (spreadsheet + PDF applicants)
- Gemini screening service (6-category weighted scoring, ranking, reasoning)
- Screening endpoint (`POST /api/screen/`)
- Tests, ruff, pyright passing

### ftbm (teammate's branch)
- MongoDB connection (AsyncMongoClient + pymongo)
- User model + auth (register, login with bcrypt hashing)
- Job model + full CRUD (create, read, update, delete, search, pagination)
- Talent model following the official Umurava Talent Profile Schema
- Applicant creation endpoint (linked to job_id)
- File upload endpoint for talents (background task stub, not wired)
- Full Next.js frontend: login, register, dashboard, job CRUD forms, talent sidebar, results table
- CORS middleware, Dockerfile

## Talent Profile Schema (official Umurava spec)

Our `ParsedApplicant` needs to align with this. Key differences:

| Umurava Schema | Our ParsedApplicant | Action |
|---|---|---|
| first_name + last_name | name (single field) | Split into two |
| email | email | Same |
| headline | (missing) | Add |
| bio | summary | Rename |
| location | (missing) | Add |
| skills: [{name, level, yearsOfExperience}] | skills: string[] | Upgrade to objects |
| languages: [{name, proficiency}] | (missing) | Add |
| experience: [{company, role, dates, description, technologies}] | experience_details: string[] | Upgrade to objects |
| education: [{institution, degree, field, years}] | education: string[] | Upgrade to objects |
| certifications: [{name, issuer, date}] | (missing) | Add |
| projects: [{name, desc, technologies, role, link, dates}] | (missing) | Add |
| availability: {status, type, date} | (missing) | Add |
| social_links: {linkedin, github, portfolio} | (missing) | Add |

## Merge strategy

ftbm already has the Talent model matching the Umurava schema. Use that as the base for the data layer.

### What to keep from ftbm:
- MongoDB setup (db.py, config)
- User model + auth routes
- Job model + CRUD routes
- Talent model (matches official schema)
- Applicant creation route
- Frontend (entire src/frontend/)
- Dockerfile, CORS, .gitignore

### What to keep from fbl:
- LlamaParse PDF parser (pdf_parser.py)
- Pandas spreadsheet parser (spreadsheet_parser.py)
- File parser orchestrator (file_parser.py)
- Email-based merge service (merge.py)
- Gemini screening service (screening.py)
- Upload endpoint (with thread pool fix for LlamaParse)
- Screening endpoint
- Scoring weights config

### What needs adapting:
- Our upload/parsing output must produce data compatible with the ftbm Talent model
- The screening service prompt should reference the full Talent schema fields
- Wire screening results back to MongoDB
- Connect upload endpoint to save parsed applicants to DB
