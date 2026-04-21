"use client";

import { useState } from "react";
import {
  UserCircleIcon,
  SparklesIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  MapPinIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  LinkIcon,
} from "@heroicons/react/24/outline";
import { ViewTalent } from "../talents/button";

type Screening = {
  rank: number;
  final_score: number;
  scores: {
    work_experience: number;
    skills_match: number;
    projects_portfolio: number;
    education: number;
    certifications: number;
    other: number;
  };
  strengths: string[];
  gaps: string[];
  recommendation: string;
};

type Skill = { name: string; level: string; yearsOfExperience: number };
type ExperienceEntry = {
  company: string;
  role: string;
  "Start Date": string;
  "End Date": string;
  "Is Current"?: boolean;
};
type EducationEntry = {
  institution: string;
  degree: string;
  "Field of Study": string;
  "Start Year": number;
  "End Year": number;
};
type ProjectEntry = {
  name: string;
  description: string;
  link?: string;
};

type Candidate = {
  _id: string;
  first_name?: string;
  last_name?: string;
  email: string;
  headline?: string;
  location?: string;
  skills?: Skill[];
  experience?: ExperienceEntry[];
  education?: EducationEntry[];
  projects?: ProjectEntry[];
  screening?: Screening | null;
};

function ScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-24 text-stone-500 truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-600 rounded-full"
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="w-7 text-right text-stone-600 font-medium">{score}</span>
    </div>
  );
}

function fullName(c: Candidate): string {
  const name = `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim();
  return name || c.email;
}

export default function TalentSidebar({
  candidates,
  totalCount,
}: {
  candidates: Candidate[];
  totalCount?: number;
}) {
  const uploaded = totalCount ?? candidates.length;
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const screened = candidates
    .filter((c) => c.screening?.rank)
    .sort((a, b) => (a.screening!.rank ?? 0) - (b.screening!.rank ?? 0));

  if (screened.length === 0) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-6 text-center text-stone-500 shadow-sm">
        <UserCircleIcon className="mx-auto mb-2 h-8 w-8 text-gray-300" />
        <p className="text-sm">
          {uploaded > 0
            ? `${uploaded} candidate${uploaded !== 1 ? "s" : ""} uploaded. Click "Screen Candidates" to run AI screening.`
            : "No candidates yet. Upload a file when creating or editing the job."}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="border-b border-gray-100 bg-gray-50/50 p-4">
        <h2 className="flex items-center gap-2 font-bold text-stone-900">
          <SparklesIcon className="h-5 w-5 text-amber-600" />
          Top AI Matches ({screened.length})
        </h2>
      </div>

      <div className="divide-y divide-gray-100">
        {screened.map((candidate) => {
          const s = candidate.screening!;
          const isExpanded = expandedId === candidate._id;

          return (
            <div
              key={candidate._id}
              className="p-4 transition-colors hover:bg-gray-50/50"
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : candidate._id)}
                className="flex w-full items-center justify-between text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-800">
                    #{s.rank}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-stone-900 truncate">
                      {fullName(candidate)}
                    </p>
                    {candidate.headline && (
                      <p className="text-xs text-stone-600 truncate">
                        {candidate.headline}
                      </p>
                    )}
                    <p className="text-xs font-medium text-stone-500">
                      Score: {s.final_score.toFixed(1)}/100
                    </p>
                  </div>
                  <ViewTalent id={candidate._id} />
                </div>

                {isExpanded ? (
                  <ChevronUpIcon className="h-5 w-5 text-gray-400 shrink-0" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5 text-gray-400 shrink-0" />
                )}
              </button>

              {isExpanded && (
                <div className="mt-4 space-y-4">
                  {/* Quick info */}
                  {(candidate.location || candidate.email) && (
                    <div className="text-xs text-stone-600 space-y-1">
                      {candidate.location && (
                        <div className="flex items-center gap-1">
                          <MapPinIcon className="h-3 w-3" />
                          {candidate.location}
                        </div>
                      )}
                      {candidate.email && (
                        <div className="flex items-center gap-1">
                          <LinkIcon className="h-3 w-3" />
                          {candidate.email}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Score breakdown */}
                  <div className="rounded-lg bg-gray-50 p-3 space-y-2">
                    <p className="text-xs font-semibold text-stone-700 mb-2">
                      Score Breakdown
                    </p>
                    <ScoreBar
                      label="Experience"
                      score={s.scores.work_experience}
                    />
                    <ScoreBar label="Skills" score={s.scores.skills_match} />
                    <ScoreBar
                      label="Projects"
                      score={s.scores.projects_portfolio}
                    />
                    <ScoreBar label="Education" score={s.scores.education} />
                    <ScoreBar label="Certs" score={s.scores.certifications} />
                    <ScoreBar label="Other" score={s.scores.other} />
                  </div>

                  {/* Skills with levels */}
                  {candidate.skills && candidate.skills.length > 0 && (
                    <div className="rounded-lg bg-stone-50 p-3">
                      <p className="text-xs font-semibold text-stone-700 mb-2">
                        Skills
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {candidate.skills.slice(0, 12).map((skill, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-xs text-stone-700 ring-1 ring-stone-200"
                            title={`${skill.level} • ${skill.yearsOfExperience}y`}
                          >
                            {skill.name}
                            <span className="text-stone-400">
                              · {skill.level[0]}
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Experience timeline */}
                  {candidate.experience && candidate.experience.length > 0 && (
                    <div className="rounded-lg bg-stone-50 p-3">
                      <p className="flex items-center gap-1 text-xs font-semibold text-stone-700 mb-2">
                        <BriefcaseIcon className="h-3 w-3" /> Experience
                      </p>
                      <ul className="space-y-1.5">
                        {candidate.experience.slice(0, 4).map((exp, i) => (
                          <li key={i} className="text-xs">
                            <span className="font-medium text-stone-900">
                              {exp.role}
                            </span>{" "}
                            <span className="text-stone-500">at</span>{" "}
                            <span className="text-stone-700">
                              {exp.company}
                            </span>
                            <span className="text-stone-400 ml-1">
                              ({exp["Start Date"]} – {exp["End Date"]})
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Education */}
                  {candidate.education && candidate.education.length > 0 && (
                    <div className="rounded-lg bg-stone-50 p-3">
                      <p className="flex items-center gap-1 text-xs font-semibold text-stone-700 mb-2">
                        <AcademicCapIcon className="h-3 w-3" /> Education
                      </p>
                      <ul className="space-y-1">
                        {candidate.education.map((edu, i) => (
                          <li key={i} className="text-xs text-stone-700">
                            <span className="font-medium">{edu.degree}</span> in{" "}
                            {edu["Field of Study"]} ·{" "}
                            <span className="text-stone-500">
                              {edu.institution}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Strengths */}
                  {s.strengths.length > 0 && (
                    <div className="rounded-lg bg-green-50/50 p-3 ring-1 ring-inset ring-green-600/10">
                      <p className="text-xs font-semibold text-green-800 mb-1">
                        Strengths
                      </p>
                      <ul className="text-xs text-green-700 space-y-1">
                        {s.strengths.map((str, i) => (
                          <li key={i}>+ {str}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Gaps */}
                  {s.gaps.length > 0 && (
                    <div className="rounded-lg bg-red-50/50 p-3 ring-1 ring-inset ring-red-600/10">
                      <p className="text-xs font-semibold text-red-800 mb-1">
                        Gaps
                      </p>
                      <ul className="text-xs text-red-700 space-y-1">
                        {s.gaps.map((gap, i) => (
                          <li key={i}>- {gap}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommendation */}
                  <div className="rounded-lg bg-amber-50/50 p-3 ring-1 ring-inset ring-amber-600/10">
                    <p className="text-xs font-semibold text-amber-900 mb-1">
                      Recommendation
                    </p>
                    <p className="text-xs text-stone-700">{s.recommendation}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
