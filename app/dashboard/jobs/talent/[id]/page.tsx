import { notFound } from "next/navigation";
import Breadcrumbs from "@/app/ui/jobs/breadcrumbs";
import { fetchTalentById } from "@/app/lib/data";
import {
  EnvelopeIcon,
  MapPinIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  LanguageIcon,
  StarIcon,
  CheckBadgeIcon,
  LinkIcon,
  SparklesIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = params.id;

  const talent = await fetchTalentById(id);

  if (!talent) {
    notFound();
  }

  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: "Jobs", href: "/dashboard/jobs" },
          { label: "Talent Pool", href: `/dashboard/jobs/${talent.job_id}` },
          {
            label: `${talent.first_name} ${talent.last_name}`,
            href: `/dashboard/talents/${id}`,
            active: true,
          },
        ]}
      />

      <div className="mt-6 flex flex-col gap-6">
        {/* --- HEADER & ACTION CARD --- */}
        <div className="overflow-hidden rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100 md:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-bold text-stone-900">
                {talent.first_name} {talent.last_name}
              </h1>
              <p className="text-lg font-medium text-amber-700">
                {talent.headline}
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-stone-500">
                <div className="flex items-center gap-1">
                  <MapPinIcon className="h-5 w-5" />
                  {talent.location}
                </div>
                <div className="flex items-center gap-1">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      talent.availability?.status === "Available"
                        ? "bg-green-100 text-green-800"
                        : talent.availability?.status ===
                            "Open to Opportunities"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {talent.availability?.status} ({talent.availability?.type})
                  </span>
                </div>
              </div>
            </div>

            <a
              href={`mailto:${talent.email}?subject=Regarding your application for Job ID: ${talent.job_id}`}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-700 px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
            >
              <EnvelopeIcon className="h-5 w-5" />
              Email {talent.first_name}
            </a>
          </div>

          {talent.bio && (
            <div className="mt-6 border-t border-gray-100 pt-6">
              <h2 className="mb-2 text-sm font-semibold text-stone-900">
                About
              </h2>
              <p className="whitespace-pre-wrap leading-relaxed text-stone-600">
                {talent.bio}
              </p>
            </div>
          )}
        </div>

        {/* MAIN CONTENT GRID*/}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-6 lg:col-span-2">
            {/* AI SCREENING REPORT */}
            {talent.screening && (
              <div className="rounded-xl border-t-4 border-amber-700 bg-amber-100 p-6 shadow-sm ring-1 ring-amber-100">
                <div className="mb-6 flex flex-col justify-between gap-4 border-b border-amber-100 pb-4 sm:flex-row sm:items-center">
                  <h2 className="flex items-center gap-2 text-xl font-bold text-amber-900">
                    <SparklesIcon className="h-6 w-6 text-amber-800" />
                    AI Screening Report
                  </h2>
                  <div className="flex flex-wrap gap-3">
                    <span className="rounded-full bg-white px-4 py-1 text-sm font-bold text-amber-800 shadow-sm ring-1 ring-amber-200">
                      Rank #{talent.screening.rank}
                    </span>
                    <span className="rounded-full bg-amber-600 px-4 py-1 text-sm font-bold text-white shadow-sm">
                      Score: {talent.screening.final_score}/100
                    </span>
                  </div>
                </div>

                <div className="mb-6 border-l-4 border-amber-300 pl-4">
                  <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-amber-900">
                    AI Recommendation
                  </h3>
                  <p className="text-base font-medium italic leading-relaxed text-amber-900">
                    "{talent.screening.recommendation}"
                  </p>
                </div>

                {/* Dynamic Category Scores */}
                {talent.screening.scores && (
                  <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {Object.entries(talent.screening.scores).map(
                      ([category, score]) => (
                        <div
                          key={category}
                          className="rounded-lg border border-amber-100 bg-white p-3 shadow-sm"
                        >
                          <div className="mb-1 truncate text-xs uppercase tracking-wider text-stone-500">
                            {category.replace(/_/g, " ")}
                          </div>
                          <div className="text-lg font-bold text-indigo-900">
                            {String(score)}/100
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                )}

                {/* Strengths & Gaps */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-indigo-50">
                    <h3 className="mb-3 flex items-center gap-2 font-bold text-emerald-800">
                      <CheckCircleIcon className="h-5 w-5 text-emerald-600" />
                      Key Strengths
                    </h3>
                    <ul className="space-y-2">
                      {talent.screening.strengths.map((strength, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-stone-700"
                        >
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500"></span>
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-indigo-50">
                    <h3 className="mb-3 flex items-center gap-2 font-bold text-rose-800">
                      <ExclamationTriangleIcon className="h-5 w-5 text-rose-600" />
                      Identified Gaps
                    </h3>
                    <ul className="space-y-2">
                      {talent.screening.gaps.map((gap, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-stone-700"
                        >
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500"></span>
                          {gap}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Experience */}
            {talent.experience && talent.experience.length > 0 && (
              <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-4">
                  <BriefcaseIcon className="h-6 w-6 text-stone-400" />
                  <h2 className="text-xl font-bold text-stone-900">
                    Experience
                  </h2>
                </div>
                <div className="space-y-6">
                  {talent.experience.map((exp, idx) => (
                    <div key={idx} className="flex flex-col gap-1">
                      <h3 className="font-semibold text-stone-900">
                        {exp.role}
                      </h3>
                      <div className="flex justify-between text-sm text-stone-500">
                        <span className="font-medium text-amber-700">
                          {exp.company}
                        </span>
                        <span>
                          {exp["Start Date"]} - {exp["End Date"]}
                        </span>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-stone-600">
                        {exp.description}
                      </p>
                      {exp.technologies.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {exp.technologies.map((tech) => (
                            <span
                              key={tech}
                              className="rounded-md bg-stone-100 px-2 py-1 text-xs text-stone-600"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Projects */}
            {talent.projects && talent.projects.length > 0 && (
              <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-4">
                  <BriefcaseIcon className="h-6 w-6 text-stone-400" />
                  <h2 className="text-xl font-bold text-stone-900">Projects</h2>
                </div>
                <div className="space-y-6">
                  {talent.projects.map((proj, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col gap-1 border-l-2 border-amber-200 pl-4"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-stone-900">
                          {proj.name}
                        </h3>
                        {proj.link && (
                          <a
                            href={proj.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-amber-600 hover:text-amber-800"
                          >
                            <LinkIcon className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                      <span className="text-sm text-stone-500">
                        {proj.role}
                      </span>
                      <p className="mt-1 text-sm text-stone-600">
                        {proj.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col gap-6 lg:col-span-1">
            {/* Education */}
            {talent.education && talent.education.length > 0 && (
              <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-4">
                  <AcademicCapIcon className="h-6 w-6 text-stone-400" />
                  <h2 className="text-xl font-bold text-stone-900">
                    Education
                  </h2>
                </div>
                <div className="space-y-4">
                  {talent.education.map((edu, idx) => (
                    <div key={idx} className="flex flex-col">
                      <h3 className="font-semibold text-stone-900">
                        {edu.institution}
                      </h3>
                      <span className="text-sm text-stone-600">
                        {edu.degree} in {edu["Field of Study"]}
                      </span>
                      <span className="text-xs text-stone-400">
                        {edu["Start Year"]} - {edu["End Year"]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Skills */}
            <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <h2 className="mb-4 text-lg font-bold text-stone-900">
                Top Skills
              </h2>
              <div className="flex flex-col gap-3">
                {talent.skills.map((skill) => (
                  <div
                    key={skill.name}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="font-medium text-stone-700">
                      {skill.name}
                    </span>
                    <span className="rounded bg-stone-100 px-2 py-1 text-xs text-stone-500">
                      {skill.level} • {skill.yearsOfExperience}y
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Languages */}
            {talent.languages && talent.languages.length > 0 && (
              <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                <div className="mb-4 flex items-center gap-2">
                  <LanguageIcon className="h-5 w-5 text-stone-400" />
                  <h2 className="text-lg font-bold text-stone-900">
                    Languages
                  </h2>
                </div>
                <div className="flex flex-col gap-2 text-sm">
                  {talent.languages.map((lang) => (
                    <div key={lang.name} className="flex justify-between">
                      <span className="text-stone-700">{lang.name}</span>
                      <span className="text-stone-500">{lang.proficiency}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {talent.certifications && talent.certifications.length > 0 && (
              <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                <div className="mb-4 flex items-center gap-2">
                  <CheckBadgeIcon className="h-5 w-5 text-stone-400" />
                  <h2 className="text-lg font-bold text-stone-900">
                    Certifications
                  </h2>
                </div>
                <div className="flex flex-col gap-3">
                  {talent.certifications.map((cert) => (
                    <div key={cert.name} className="flex flex-col text-sm">
                      <span className="font-semibold text-stone-800">
                        {cert.name}
                      </span>
                      <span className="text-xs text-stone-500">
                        {cert.issuer} • {cert["Issue Date"]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
