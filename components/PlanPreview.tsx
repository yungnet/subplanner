"use client";

import { SubPlan } from "@/types/plan";

interface PlanPreviewProps {
  plan: SubPlan;
  onEdit: () => void;
}

export default function PlanPreview({ plan, onEdit }: PlanPreviewProps) {
  const formattedDate = plan.date
    ? new Date(plan.date + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <div>
      {/* Nav buttons */}
      <div className="no-print flex gap-3 mb-6 justify-end">
        <button
          onClick={onEdit}
          className="bg-white/50 backdrop-blur-sm border border-white/70 text-gray-700 px-6 py-2.5 rounded-xl font-semibold hover:bg-white/80 transition-all"
        >
          Edit
        </button>
        <button
          onClick={() => window.print()}
          className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-200/60 hover:from-indigo-600 hover:to-violet-600 transition-all"
        >
          Print
        </button>
      </div>

      {/* Printable card */}
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
          {[
            ["Teacher", plan.teacherName],
            ["Date", formattedDate],
            ["Grade Level", plan.gradeLevel],
            ["Room", plan.room],
          ].map(([key, val]) => (
            <div key={key} className="flex gap-2">
              <span className="font-semibold text-gray-500 shrink-0">{key}:</span>
              <span className="text-gray-800">{val}</span>
            </div>
          ))}
        </div>

        {/* Emergency box */}
        <div className="bg-rose-50/80 border border-rose-200 rounded-xl p-4 mb-6 print:bg-rose-50 print:border-rose-400">
          <h2 className="text-rose-600 font-bold text-sm mb-2 flex items-center gap-1.5 print:text-gray-900">
            ⚠ EMERGENCY CONTACT
          </h2>
          <div className="text-sm space-y-1 text-gray-700">
            <div className="flex gap-2">
              <span className="font-semibold shrink-0">Contact:</span>
              <span>{plan.emergencyContact}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-semibold shrink-0">Phone:</span>
              <span>{plan.emergencyPhone}</span>
            </div>
          </div>
        </div>

        {/* Section helper */}
        {[
          { title: "Attendance", color: "text-teal-600 border-teal-100", content: <p className="text-sm text-gray-700 whitespace-pre-wrap">{plan.attendance}</p> },
        ].map(({ title, color, content }) => (
          <div key={title} className="mb-5">
            <h2 className={`text-sm font-bold border-b pb-1 mb-2 print:text-gray-800 print:border-gray-300 ${color}`}>{title}</h2>
            {content}
          </div>
        ))}

        {/* Schedule table */}
        <div className="mb-5">
          <h2 className="text-sm font-bold text-violet-600 border-b border-violet-100 pb-1 mb-2 print:text-gray-800 print:border-gray-300">
            Daily Schedule
          </h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-violet-50/80 text-gray-600 print:bg-gray-100">
                <th className="text-left px-3 py-2 border border-gray-200 font-semibold w-1/5">Time</th>
                <th className="text-left px-3 py-2 border border-gray-200 font-semibold w-1/5">Subject</th>
                <th className="text-left px-3 py-2 border border-gray-200 font-semibold w-2/5">Activity</th>
                <th className="text-left px-3 py-2 border border-gray-200 font-semibold w-1/5">Location</th>
              </tr>
            </thead>
            <tbody>
              {plan.periods.map((period, index) => (
                <tr key={index} className={index % 2 === 0 ? "bg-white/60" : "bg-slate-50/60"}>
                  <td className="px-3 py-2 border border-gray-200 text-gray-700">{period.time}</td>
                  <td className="px-3 py-2 border border-gray-200 font-medium text-gray-800">{period.subject}</td>
                  <td className="px-3 py-2 border border-gray-200 text-gray-700">{period.activity}</td>
                  <td className="px-3 py-2 border border-gray-200 text-gray-700">{period.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Classroom Rules */}
        <div className="mb-5">
          <h2 className="text-sm font-bold text-amber-600 border-b border-amber-100 pb-1 mb-2 print:text-gray-800 print:border-gray-300">
            Classroom Rules
          </h2>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            {plan.classroomRules.map((rule, i) => <li key={i}>{rule}</li>)}
          </ul>
        </div>

        {/* Students */}
        {plan.studentsToWatch && (
          <div className="mb-5">
            <h2 className="text-sm font-bold text-sky-600 border-b border-sky-100 pb-1 mb-2 print:text-gray-800 print:border-gray-300">
              Students Needing Attention
            </h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{plan.studentsToWatch}</p>
          </div>
        )}

        {/* End of Day */}
        <div className="mb-5">
          <h2 className="text-sm font-bold text-emerald-600 border-b border-emerald-100 pb-1 mb-2 print:text-gray-800 print:border-gray-300">
            End of Day
          </h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{plan.endOfDayInstructions}</p>
        </div>

        {/* Additional Notes */}
        {plan.specialNotes && (
          <div className="mb-8">
            <h2 className="text-sm font-bold text-purple-600 border-b border-purple-100 pb-1 mb-2 print:text-gray-800 print:border-gray-300">
              Additional Notes
            </h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{plan.specialNotes}</p>
          </div>
        )}

        {/* Signature line */}
        <div className="border-t border-gray-200 pt-6 mt-8 grid grid-cols-2 gap-8 text-sm">
          <div>
            <div className="border-b border-gray-300 h-8 mb-1" />
            <p className="text-gray-400 text-xs">Substitute Signature</p>
          </div>
          <div>
            <div className="border-b border-gray-300 h-8 mb-1" />
            <p className="text-gray-400 text-xs">Date</p>
          </div>
        </div>
      </div>
    </div>
  );
}
