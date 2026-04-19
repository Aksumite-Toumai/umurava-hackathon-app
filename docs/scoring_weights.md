# Scoring Weights — Default Configuration

The AI screening system uses a **fixed weighted scoring model** with 6 categories. Each candidate is scored 0–100 per category by Gemini, then a weighted average produces the final score.

## Categories & Weights

| # | Category | Weight | What is evaluated |
|---|---|---|---|
| 1 | **Work Experience** | 30% | Relevance of past roles, responsibilities, years of experience |
| 2 | **Skills Match** | 25% | How well the candidate's skills match job requirements |
| 3 | **Projects & Portfolio** | 15% | Relevant projects, contributions, demonstrable impact |
| 4 | **Education** | 12% | Degree level, field relevance, institution quality |
| 5 | **Certifications & Training** | 10% | Professional certifications, courses, ongoing learning |
| 6 | **Other** | 8% | Extracurriculars, leadership, volunteering, soft skills, cultural fit |

**Total: 100%**

## Formula

```
final_score = (work_experience × 0.30)
            + (skills_match × 0.25)
            + (projects_portfolio × 0.15)
            + (education × 0.12)
            + (certifications × 0.10)
            + (other × 0.08)
```

## Design Decisions

- **Work Experience gets the highest weight (30%)** — for job screening, real-world experience is the strongest predictor of job fit.
- **Projects & Portfolio ranks above Education** — demonstrable work output is more valuable than credentials for most roles.
- **Education at 12%** — important but not dominant. A strong portfolio/experience can compensate.
- **Other at 8%** — captures soft factors that differentiate otherwise equal candidates.
- **Weights are fixed (not customizable per job)** — keeps the system simple and consistent. Future enhancement could allow recruiter-adjustable weights.

## Where this is implemented

- Weights constant: `src/backend/app/services/screening.py` → `SCORING_WEIGHTS`
- Prompt instructions: `src/backend/app/services/screening.py` → `SYSTEM_PROMPT`
- Gemini calculates the weighted average and returns `final_score` per candidate.
