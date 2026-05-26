"use client";

import { SubPlan } from "@/types/plan";

interface PlanPreviewProps {
  plan: SubPlan;
  onEdit: () => void;
}

export default function PlanPreview({ plan, onEdit }: PlanPreviewProps) {
  function handlePrint() {
    window.print();
  }

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
      {/* Nav buttons — hidden when printing */}
      <div className="no-print flex gap-3 mb-6 justify-end">
        <button
          onClick={onEdit}
          className="border border-gray-400 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
        >
          Edit
        </button>
        <button
          onClick={handlePrint}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Print
        </button>
      </div>

      {/* Printable content */}
      <div className="bg-white rounded-lg shadow p-8 max-w-3xl mx-auto print:shadow-none print:p-0 print:max-w-none">
        {/* Header */}
        <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 tracking-wide">SUBSTITUTE TEACHER PLAN</h1>
          <p className="text-gray-500 text-sm mt-1">Please leave this completed form on the desk at the end of the day.</p>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-6 text-sm">
          <div className="flex gap-2">
            <span className="font-semibold text-gray-700 shrink-0">Teacher:</span>
            <span className="text-gray-900">{plan.teacherName}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-semibold text-gray-700 shrink-0">Date:</span>
            <span className="text-gray-900">{formattedDate}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-semibold text-gray-700 shrink-0">Grade Level:</span>
            <span className="text-gray-900">{plan.gradeLevel}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-semibold text-gray-700 shrink-0">Room:</span>
            <span className="text-gray-900">{plan.room}</span>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4 mb-6">
          <h2 className="text-red-700 font-bold text-base mb-2 flex items-center gap-2">
            <span>&#9888;</span> EMERGENCY CONTACT
          </h2>
          <div className="text-sm space-y-1">
            <div className="flex gap-2">
              <span className="font-semibold text-gray-700 shrink-0">Contact:</span>
              <span>{plan.emergencyContact}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-semibold text-gray-700 shrink-0">Phone:</span>
              <span>{plan.emergencyPhone}</span>
            </div>
          </div>
        </div>

        {/* Attendance */}
        <div className="mb-6">
          <h2 className="text-base font-bold text-gray-800 border-b border-gray-300 pb-1 mb-2">Attendance</h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{plan.attendance}</p>
        </div>

        {/* Daily Schedule */}
        <div className="mb-6">
          <h2 className="text-base font-bold text-gray-800 border-b border-gray-300 pb-1 mb-2">Daily Schedule</h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-200 text-gray-700">
                <th className="text-left px-3 py-2 border border-gray-300 font-semibold w-1/5">Time</th>
                <th className="text-left px-3 py-2 border border-gray-300 font-semibold w-1/5">Subject</th>
                <th className="text-left px-3 py-2 border border-gray-300 font-semibold w-2/5">Activity</th>
                <th className="text-left px-3 py-2 border border-gray-300 font-semibold w-1/5">Location</th>
              </tr>
            </thead>
            <tbody>
              {plan.periods.map((period, index) => (
                <tr
                  key={index}
                  className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="px-3 py-2 border border-gray-300">{period.time}</td>
                  <td className="px-3 py-2 border border-gray-300 font-medium">{period.subject}</td>
                  <td className="px-3 py-2 border border-gray-300">{period.activity}</td>
                  <td className="px-3 py-2 border border-gray-300">{period.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Classroom Rules */}
        <div className="mb-6">
          <h2 className="text-base font-bold text-gray-800 border-b border-gray-300 pb-1 mb-2">Classroom Rules</h2>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            {plan.classroomRules.map((rule, index) => (
              <li key={index}>{rule}</li>
            ))}
          </ul>
        </div>

        {/* Students Needing Attention */}
        {plan.studentsToWatch && (
          <div className="mb-6">
            <h2 className="text-base font-bold text-gray-800 border-b border-gray-300 pb-1 mb-2">
              Students Needing Attention
            </h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{plan.studentsToWatch}</p>
          </div>
        )}

        {/* End of Day */}
        <div className="mb-6">
          <h2 className="text-base font-bold text-gray-800 border-b border-gray-300 pb-1 mb-2">End of Day</h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{plan.endOfDayInstructions}</p>
        </div>

        {/* Special Notes */}
        {plan.specialNotes && (
          <div className="mb-8">
            <h2 className="text-base font-bold text-gray-800 border-b border-gray-300 pb-1 mb-2">Additional Notes</h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{plan.specialNotes}</p>
          </div>
        )}

        {/* Signature Line */}
        <div className="border-t-2 border-gray-300 pt-6 mt-8 grid grid-cols-2 gap-8 text-sm">
          <div>
            <div className="border-b border-gray-400 pb-1 mb-1 h-8"></div>
            <p className="text-gray-600">Substitute Signature</p>
          </div>
          <div>
            <div className="border-b border-gray-400 pb-1 mb-1 h-8"></div>
            <p className="text-gray-600">Date</p>
          </div>
        </div>
      </div>
    </div>
  );
}
