"use client";

import { useState } from "react";
import { GeneratedWorksheet, SubPlan } from "@/types/plan";

interface PlanPreviewProps {
  plan: SubPlan;
  worksheets: GeneratedWorksheet[];
  onEdit: () => void;
}

type DownloadStatus = "idle" | "generating" | "done";

export default function PlanPreview({ plan, worksheets, onEdit }: PlanPreviewProps) {
  const [downloadStatus, setDownloadStatus] = useState<DownloadStatus>("idle");

  const formattedDate = plan.date
    ? new Date(plan.date + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
      })
    : "";

  function handleSave() {
    const payload = { plan, worksheets };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subplan-${plan.date || "draft"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDownloadDocx() {
    if (downloadStatus === "generating") return;
    setDownloadStatus("generating");
    try {
      const { generateSubPackageDocx } = await import("@/lib/generateDocx");
      const blob = await generateSubPackageDocx(plan, worksheets, formattedDate);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `subplan-${plan.date || "draft"}.docx`;
      a.click();
      URL.revokeObjectURL(url);
      setDownloadStatus("done");
      setTimeout(() => setDownloadStatus("idle"), 2000);
    } catch (err) {
      console.error("DOCX generation failed:", err);
      setDownloadStatus("idle");
    }
  }

  return (
    <div>
      {/* Nav buttons */}
      <div className="no-print flex gap-3 mb-6 justify-end flex-wrap">
        <button
          onClick={onEdit}
          className="bg-white/50 backdrop-blur-sm border border-white/70 text-gray-700 px-5 py-2.5 rounded-xl font-semibold hover:bg-white/80 transition-all"
        >
          Edit
        </button>
        <button
          onClick={handleSave}
          className="bg-white/50 backdrop-blur-sm border border-white/70 text-gray-700 px-5 py-2.5 rounded-xl font-semibold hover:bg-white/80 transition-all"
        >
          💾 Save Plan
        </button>
        <button
          onClick={handleDownloadDocx}
          disabled={downloadStatus === "generating"}
          className={`px-5 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 ${
            downloadStatus === "done"
              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200/60"
              : "bg-white/50 backdrop-blur-sm border border-white/70 text-gray-700 hover:bg-white/80 disabled:opacity-50"
          }`}
        >
          {downloadStatus === "generating" ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Building…
            </>
          ) : downloadStatus === "done" ? (
            "✓ Downloaded!"
          ) : (
            <>📄 {worksheets.length > 0 ? `Download Sub Package (${worksheets.length + 1} pages)` : "Download as Word Doc"}</>
          )}
        </button>
        <button
          onClick={() => window.print()}
          className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-200/60 hover:from-indigo-600 hover:to-violet-600 transition-all"
        >
          Print
        </button>
      </div>

      {/* Worksheets summary (if any) */}
      {worksheets.length > 0 && (
        <div className="no-print mb-5 bg-emerald-50/80 backdrop-blur-sm border border-emerald-200/60 rounded-2xl p-5">
          <p className="text-sm font-bold text-emerald-700 mb-2">
            📋 {worksheets.length} worksheet{worksheets.length > 1 ? "s" : ""} included in download
          </p>
          <div className="space-y-1">
            {worksheets.map((ws) => (
              <div key={ws.materialId} className="flex items-center gap-2 text-sm text-emerald-600">
                <span className="text-emerald-400">✓</span>
                <span>{ws.title}</span>
                <span className="text-emerald-400 text-xs">· {ws.questions.length} questions</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Printable card ────────────────────────────────────────────────── */}
      <div className="bg-white/50 backdrop-blur-2xl border border-white/60 rounded-2xl shadow-xl shadow-black/5 p-8 max-w-3xl mx-auto print:shadow-none print:bg-white print:border-0 print:rounded-none print:p-0 print:max-w-none">

        {/* Header */}
        <div className="text-center border-b-2 border-indigo-100 pb-5 mb-6 print:border-gray-300">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent print:text-gray-900 print:bg-none tracking-wide">
            SUBSTITUTE TEACHER PLAN
          </h1>
          <p className="text-gray-400 text-xs mt-1">Please leave this form on the desk at the end of the day.</p>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-6 text-sm">
          {[["Teacher", "Mrs. Yung"], ["Date", formattedDate], ["Grade Level", plan.gradeLevel], ["Room", plan.room]].map(([key, val]) => (
            <div key={key} className="flex gap-2">
              <span className="font-semibold text-gray-500 shrink-0">{key}:</span>
              <span className="text-gray-800">{val}</span>
            </div>
          ))}
        </div>

        {/* Attendance */}
        <div className="mb-5">
          <h2 className="text-sm font-bold text-teal-600 border-b border-teal-100 pb-1 mb-2 print:text-gray-800 print:border-gray-300">Attendance</h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{plan.attendance}</p>
        </div>

        {/* Schedule */}
        <div className="mb-5">
          <h2 className="text-sm font-bold text-violet-600 border-b border-violet-100 pb-1 mb-2 print:text-gray-800 print:border-gray-300">Daily Schedule</h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-violet-50/80 text-gray-600 print:bg-gray-100">
                {["Time", "Subject", "Activity", "Location"].map((h) => (
                  <th key={h} className="text-left px-3 py-2 border border-gray-200 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {plan.periods.map((p, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-white/60" : "bg-slate-50/60"}>
                  <td className="px-3 py-2 border border-gray-200 text-gray-700 w-1/5">{p.time}</td>
                  <td className="px-3 py-2 border border-gray-200 font-medium text-gray-800 w-1/5">{p.subject}</td>
                  <td className="px-3 py-2 border border-gray-200 text-gray-700 w-2/5">{p.activity}</td>
                  <td className="px-3 py-2 border border-gray-200 text-gray-700 w-1/5">{p.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Rules */}
        <div className="mb-5">
          <h2 className="text-sm font-bold text-amber-600 border-b border-amber-100 pb-1 mb-2 print:text-gray-800 print:border-gray-300">Classroom Rules</h2>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            {plan.classroomRules.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </div>

        {/* Students */}
        {plan.studentsToWatch && (
          <div className="mb-5">
            <h2 className="text-sm font-bold text-sky-600 border-b border-sky-100 pb-1 mb-2 print:text-gray-800 print:border-gray-300">Students Needing Attention</h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{plan.studentsToWatch}</p>
          </div>
        )}

        {/* End of Day */}
        <div className="mb-5">
          <h2 className="text-sm font-bold text-emerald-600 border-b border-emerald-100 pb-1 mb-2 print:text-gray-800 print:border-gray-300">End of Day</h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{plan.endOfDayInstructions}</p>
        </div>

        {/* Notes */}
        {plan.specialNotes && (
          <div className="mb-8">
            <h2 className="text-sm font-bold text-purple-600 border-b border-purple-100 pb-1 mb-2 print:text-gray-800 print:border-gray-300">Additional Notes</h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{plan.specialNotes}</p>
          </div>
        )}

        {/* Feedback prompt */}
        {plan.subFeedbackPrompt && (
          <div className="mb-8 border-2 border-pink-200 rounded-xl p-4 bg-pink-50/60 print:bg-white print:border-gray-400">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{plan.subFeedbackPrompt}</p>
          </div>
        )}

        {/* Signature */}
        <div className="border-t border-gray-200 pt-6 mt-8 grid grid-cols-2 gap-8 text-sm">
          <div><div className="border-b border-gray-300 h-8 mb-1" /><p className="text-gray-400 text-xs">Substitute Signature</p></div>
          <div><div className="border-b border-gray-300 h-8 mb-1" /><p className="text-gray-400 text-xs">Date</p></div>
        </div>
      </div>
    </div>
  );
}
