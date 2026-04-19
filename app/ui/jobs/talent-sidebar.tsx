"use client";

import { useState } from "react";
import {
  UserCircleIcon,
  SparklesIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";

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

type Candidate = {
  _id: string;
  name: string;
  email?: string | null;
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

export default function TalentSidebar({
  candidates,
}: {
  candidates: Candidate[];
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Only show screened candidates, sorted by rank
  const screened = candidates
    .filter((c) => c.screening?.rank)
    .sort((a, b) => (a.screening!.rank ?? 0) - (b.screening!.rank ?? 0));

  if (screened.length === 0) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-6 text-center text-stone-500 shadow-sm">
        <UserCircleIcon className="mx-auto mb-2 h-8 w-8 text-gray-300" />
        <p className="text-sm">
          {candidates.length > 0
            ? "Candidates uploaded. Click \"Screen Candidates\" to run AI screening."
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
                onClick={() =>
                  setExpandedId(isExpanded ? null : candidate._id)
                }
                className="flex w-full items-center justify-between text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-800">
                    #{s.rank}
                  </div>
                  <div>
                    <p className="font-semibold text-stone-900">
                      {candidate.name}
                    </p>
                    <p className="text-xs font-medium text-stone-500">
                      Score: {s.final_score.toFixed(1)}/100
                    </p>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                )}
              </button>

              {isExpanded && (
                <div className="mt-4 space-y-4">
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
                    <p className="text-xs text-stone-700">
                      {s.recommendation}
                    </p>
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
