"use client";

import { useEffect, useMemo, useState } from "react";
import {
  EnvelopeIcon,
  XMarkIcon,
  ClipboardDocumentIcon,
  ArrowDownTrayIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline";

import {
  fetchEmailBatch,
  type EmailBatch,
  type EmailRecipient,
} from "@/app/lib/actions";

type Props = { jobId: string };

const CUTOFF_OPTIONS = [3, 5, 10, 15, 20] as const;

const DEFAULT_TEMPLATES = {
  accepted: {
    subject: "Next round — {role} at {company}",
    body:
      "Hi {first_name},\n\n" +
      "Congratulations! After careful review of all applications for the {role} position at {company}, " +
      "we'd like to move you forward to the next round.\n\n" +
      "Our team will reach out shortly to schedule the next steps.\n\n" +
      "Thanks for your interest, and we look forward to learning more about you.\n\n" +
      "Best regards,\n" +
      "Hiring Team — {company}",
  },
  rejected: {
    subject: "Update on your {role} application — {company}",
    body:
      "Hi {first_name},\n\n" +
      "Thank you for taking the time to apply for the {role} position at {company}.\n\n" +
      "After careful review, we've decided to move forward with other candidates whose " +
      "experience more closely matched our current needs. This was a competitive process " +
      "and not a reflection of your potential.\n\n" +
      "We genuinely appreciate your interest and wish you the very best in your job search.\n\n" +
      "Best regards,\n" +
      "Hiring Team — {company}",
  },
};

function fillTemplate(
  template: string,
  vars: Record<string, string>,
): string {
  let out = template;
  for (const [k, v] of Object.entries(vars)) {
    out = out.replaceAll(`{${k}}`, v);
  }
  return out;
}

function recipientVars(
  r: EmailRecipient,
  batch: EmailBatch,
): Record<string, string> {
  return {
    first_name: r.first_name || "there",
    last_name: r.last_name,
    name: `${r.first_name} ${r.last_name}`.trim() || r.email,
    role: batch.job_role,
    company: batch.job_company,
  };
}

function copyToClipboard(text: string): boolean {
  // Try modern API first
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fall through to legacy
    }
  }
  // Legacy fallback (works in HTTP / older browsers)
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export default function EmailCandidates({ jobId }: Props) {
  const [open, setOpen] = useState(false);
  const [batch, setBatch] = useState<EmailBatch | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"accepted" | "rejected">("accepted");
  const [cutoff, setCutoff] = useState<number>(10);
  const [subject, setSubject] = useState(DEFAULT_TEMPLATES.accepted.subject);
  const [body, setBody] = useState(DEFAULT_TEMPLATES.accepted.body);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!open || batch) return;
    setLoading(true);
    setError(null);
    fetchEmailBatch(jobId).then((res) => {
      if ("error" in res) {
        setError(res.error);
      } else {
        setBatch(res);
      }
      setLoading(false);
    });
  }, [open, jobId, batch]);

  function switchTab(next: "accepted" | "rejected") {
    setTab(next);
    setSubject(DEFAULT_TEMPLATES[next].subject);
    setBody(DEFAULT_TEMPLATES[next].body);
  }

  // Combine accepted+rejected (both have ranks now), then split by cutoff
  const { accepted, rejected, totalRanked } = useMemo(() => {
    if (!batch) return { accepted: [], rejected: [], totalRanked: 0 };

    const ranked = [...batch.accepted, ...batch.rejected]
      .filter((r) => r.rank !== null)
      .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));

    const unranked = [...batch.accepted, ...batch.rejected].filter(
      (r) => r.rank === null,
    );

    return {
      accepted: ranked.slice(0, cutoff),
      rejected: [...ranked.slice(cutoff), ...unranked],
      totalRanked: ranked.length,
    };
  }, [batch, cutoff]);

  const recipients = tab === "accepted" ? accepted : rejected;

  function downloadCsv() {
    if (!batch) return;
    const rows = [
      ["email", "first_name", "last_name", "rank", "final_score", "subject", "body"],
      ...recipients.map((r) => {
        const vars = recipientVars(r, batch);
        return [
          r.email,
          r.first_name,
          r.last_name,
          r.rank?.toString() ?? "",
          r.final_score?.toFixed(1) ?? "",
          fillTemplate(subject, vars),
          fillTemplate(body, vars).replaceAll("\n", "\\n"),
        ];
      }),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${(c ?? "").replaceAll('"', '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${tab}-${batch.job_role.replace(/\s+/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function copyEmails() {
    const list = recipients.map((r) => r.email).join(", ");
    const ok = copyToClipboard(list);
    setToast(
      ok
        ? `${recipients.length} email${recipients.length !== 1 ? "s" : ""} copied`
        : "Could not copy. Select and copy manually below.",
    );
    setTimeout(() => setToast(null), 2500);
  }

  function openMailtoBcc() {
    if (!batch || recipients.length === 0) return;
    const vars = {
      first_name: "candidate",
      last_name: "",
      name: "",
      role: batch.job_role,
      company: batch.job_company,
    };
    const subj = encodeURIComponent(fillTemplate(subject, vars));
    const bd = encodeURIComponent(fillTemplate(body, vars));
    const bcc = recipients.map((r) => r.email).join(",");
    window.open(`mailto:?bcc=${bcc}&subject=${subj}&body=${bd}`, "_blank");
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex h-10 items-center gap-2 rounded-lg bg-white border border-stone-300 px-4 text-sm font-medium text-stone-800 transition-colors hover:bg-stone-50"
      >
        <EnvelopeIcon className="h-4 w-4" />
        Email Candidates
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-10 items-center gap-2 rounded-lg bg-white border border-stone-300 px-4 text-sm font-medium text-stone-800 transition-colors hover:bg-stone-50"
      >
        <EnvelopeIcon className="h-4 w-4" />
        Email Candidates
      </button>

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-xl bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 p-4">
            <h2 className="flex items-center gap-2 font-bold text-stone-900">
              <EnvelopeIcon className="h-5 w-5 text-amber-600" />
              Email Candidates
            </h2>
            <button
              onClick={() => setOpen(false)}
              className="text-stone-400 hover:text-stone-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Cutoff control */}
          <div className="flex items-center gap-2 border-b border-gray-100 bg-amber-50/30 px-4 py-3 text-sm">
            <span className="text-stone-600">Top</span>
            <select
              value={cutoff}
              onChange={(e) => setCutoff(Number(e.target.value))}
              className="rounded-md border border-stone-300 bg-white px-2 py-1 font-medium text-stone-800"
            >
              {CUTOFF_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span className="text-stone-600">
              candidates accepted; the rest rejected.{" "}
              {batch && (
                <span className="text-stone-400">
                  ({totalRanked} ranked total)
                </span>
              )}
            </span>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => switchTab("accepted")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                tab === "accepted"
                  ? "border-b-2 border-amber-600 text-stone-900"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              Accepted ({accepted.length})
            </button>
            <button
              onClick={() => switchTab("rejected")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                tab === "rejected"
                  ? "border-b-2 border-stone-700 text-stone-900"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              Rejected ({rejected.length})
            </button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto p-4 space-y-4">
            {loading && (
              <p className="text-sm text-stone-500">Loading recipients...</p>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}

            {batch && (
              <>
                {/* Recipient list */}
                <div className="rounded-lg bg-gray-50 p-3 max-h-32 overflow-y-auto">
                  <p className="text-xs font-semibold text-stone-700 mb-2">
                    Recipients ({recipients.length})
                  </p>
                  {recipients.length === 0 ? (
                    <p className="text-xs text-stone-400">
                      No candidates in this group.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {recipients.map((r, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-xs text-stone-700 ring-1 ring-stone-200"
                        >
                          {r.email}
                          {r.rank !== null && (
                            <span className="ml-1 text-stone-400">
                              · #{r.rank}
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Subject
                  </label>
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
                  />
                </div>

                {/* Body */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Body
                  </label>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={10}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm font-mono outline-none focus:border-amber-500"
                  />
                  <p className="mt-1 text-xs text-stone-400">
                    Placeholders: {"{first_name}"}, {"{last_name}"}, {"{name}"},{" "}
                    {"{role}"}, {"{company}"}
                  </p>
                </div>

                {/* Preview for first recipient */}
                {recipients[0] && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3">
                    <p className="text-xs font-semibold text-amber-900 mb-2">
                      Preview (for {recipients[0].email})
                    </p>
                    <p className="text-xs font-medium text-stone-800 mb-1">
                      Subject:{" "}
                      {fillTemplate(subject, recipientVars(recipients[0], batch))}
                    </p>
                    <pre className="text-xs text-stone-700 whitespace-pre-wrap font-sans">
                      {fillTemplate(body, recipientVars(recipients[0], batch))}
                    </pre>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between gap-2 border-t border-gray-100 p-4 bg-gray-50/50">
            <p className="text-xs text-green-700">{toast}</p>
            <div className="flex items-center gap-2">
              <button
                onClick={copyEmails}
                disabled={recipients.length === 0}
                className="flex items-center gap-1 rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
              >
                <ClipboardDocumentIcon className="h-4 w-4" />
                Copy emails
              </button>
              <button
                onClick={downloadCsv}
                disabled={recipients.length === 0}
                className="flex items-center gap-1 rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                Download CSV
              </button>
              <button
                onClick={openMailtoBcc}
                disabled={recipients.length === 0}
                className="flex items-center gap-1 rounded-lg bg-amber-700 px-3 py-2 text-xs font-medium text-white hover:bg-amber-800 disabled:opacity-50"
              >
                <PaperAirplaneIcon className="h-4 w-4" />
                Open in mail client
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
