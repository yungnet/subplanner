"use client";

import { useState } from "react";
import { SubPlan, Period } from "@/types/plan";

const DEFAULT_RULES = [
  "Raise your hand before speaking.",
  "Stay in your seat unless given permission to move.",
  "Respect all classmates and adults.",
  "No phones or personal devices during instruction.",
  "Follow all school rules at all times.",
];

const EMPTY_PERIOD: Period = { time: "", subject: "", activity: "", location: "" };

interface PlanFormProps {
  onGenerate: (plan: SubPlan) => void;
  initialValues?: SubPlan;
}

const input =
  "w-full bg-white/70 border border-gray-300/80 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:bg-white/90 transition-all";

const label = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5";

function Section({
  title,
  color,
  children,
}: {
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white/40 backdrop-blur-2xl border border-white/60 rounded-2xl shadow-lg shadow-black/5 p-6 space-y-4">
      <h2 className={`text-base font-bold border-b pb-2 mb-1 ${color}`}>{title}</h2>
      {children}
    </div>
  );
}

export default function PlanForm({ onGenerate, initialValues }: PlanFormProps) {
  const [date, setDate] = useState(initialValues?.date ?? "");
  const [gradeLevel, setGradeLevel] = useState(initialValues?.gradeLevel ?? "");
  const [room, setRoom] = useState(initialValues?.room ?? "");
  const [attendance, setAttendance] = useState(
    initialValues?.attendance ?? "Take attendance during the first 5 minutes. Mark absences in the grade book on the desk."
  );
  const [rules, setRules] = useState<string[]>(initialValues?.classroomRules ?? DEFAULT_RULES);
  const [periods, setPeriods] = useState<Period[]>(initialValues?.periods ?? [{ ...EMPTY_PERIOD }]);
  const [studentsToWatch, setStudentsToWatch] = useState(initialValues?.studentsToWatch ?? "");
  const [endOfDayInstructions, setEndOfDayInstructions] = useState(
    initialValues?.endOfDayInstructions ?? "Ensure all students have their belongings. Dismiss only after the bell rings."
  );
  const [specialNotes, setSpecialNotes] = useState(initialValues?.specialNotes ?? "");
  const [subFeedbackPrompt, setSubFeedbackPrompt] = useState(
    initialValues?.subFeedbackPrompt ??
      "Thank you for coming in for me today! Please leave me detailed notes about how the day went and include any names of helpful students (or students you think I should know about). You can also send me an email at Jodie.Yung@ecsd.net"
  );

  function updatePeriod(index: number, field: keyof Period, value: string) {
    setPeriods((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  }
  function addPeriod() {
    setPeriods((prev) => [...prev, { ...EMPTY_PERIOD }]);
  }
  function removePeriod(index: number) {
    setPeriods((prev) => prev.filter((_, i) => i !== index));
  }
  function updateRule(index: number, value: string) {
    setRules((prev) => prev.map((r, i) => (i === index ? value : r)));
  }
  function addRule() {
    setRules((prev) => [...prev, ""]);
  }
  function removeRule(index: number) {
    setRules((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onGenerate({
      date,
      gradeLevel,
      room,
      attendance,
      classroomRules: rules.filter((r) => r.trim() !== ""),
      periods,
      studentsToWatch,
      endOfDayInstructions,
      specialNotes,
      subFeedbackPrompt,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Basic Info */}
      <Section title="Basic Info" color="text-indigo-600 border-indigo-100">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={label}>Date</label>
            <input type="date" className={input} value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div>
            <label className={label}>Grade Level</label>
            <input className={input} value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} placeholder="5th Grade" required />
          </div>
          <div>
            <label className={label}>Room Number</label>
            <input className={input} value={room} onChange={(e) => setRoom(e.target.value)} placeholder="Room 204" required />
          </div>
        </div>
      </Section>

      {/* Attendance */}
      <Section title="Attendance" color="text-teal-600 border-teal-100">
        <label className={label}>Instructions</label>
        <textarea className={input} rows={3} value={attendance} onChange={(e) => setAttendance(e.target.value)} />
      </Section>

      {/* Daily Schedule */}
      <Section title="Daily Schedule" color="text-violet-600 border-violet-100">
        <div className="space-y-3">
          {periods.map((period, index) => (
            <div key={index} className="bg-white/30 border border-gray-200/70 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-violet-500 uppercase tracking-wider">Period {index + 1}</span>
                {periods.length > 1 && (
                  <button type="button" onClick={() => removePeriod(index)} className="text-xs text-rose-500 font-semibold hover:text-rose-700 transition-colors">
                    Remove
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={label}>Time</label>
                  <input className={input} value={period.time} onChange={(e) => updatePeriod(index, "time", e.target.value)} placeholder="8:00 – 8:45 AM" />
                </div>
                <div>
                  <label className={label}>Subject</label>
                  <input className={input} value={period.subject} onChange={(e) => updatePeriod(index, "subject", e.target.value)} placeholder="Math" />
                </div>
                <div>
                  <label className={label}>Activity / Instructions</label>
                  <input className={input} value={period.activity} onChange={(e) => updatePeriod(index, "activity", e.target.value)} placeholder="Complete worksheet on desks" />
                </div>
                <div>
                  <label className={label}>Location</label>
                  <input className={input} value={period.location} onChange={(e) => updatePeriod(index, "location", e.target.value)} placeholder="Classroom / Gym / Library" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <button type="button" onClick={addPeriod} className="text-sm text-violet-600 font-semibold hover:text-violet-800 transition-colors">
          + Add Period
        </button>
      </Section>

      {/* Classroom Rules */}
      <Section title="Classroom Rules" color="text-amber-600 border-amber-100">
        <div className="space-y-2">
          {rules.map((rule, index) => (
            <div key={index} className="flex gap-2 items-center">
              <input className={`${input} flex-1`} value={rule} onChange={(e) => updateRule(index, e.target.value)} placeholder="Enter a classroom rule" />
              <button type="button" onClick={() => removeRule(index)} className="text-xs text-rose-500 font-semibold hover:text-rose-700 shrink-0 transition-colors">
                Remove
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addRule} className="text-sm text-amber-600 font-semibold hover:text-amber-800 transition-colors">
          + Add Rule
        </button>
      </Section>

      {/* Students Needing Attention */}
      <Section title="Students Needing Attention" color="text-sky-600 border-sky-100">
        <label className={label}>Notes on specific students</label>
        <textarea
          className={input}
          rows={4}
          value={studentsToWatch}
          onChange={(e) => setStudentsToWatch(e.target.value)}
          placeholder="e.g. Alex – may need help staying focused; Jordan – has an IEP, sits near front"
        />
      </Section>

      {/* End of Day */}
      <Section title="End of Day" color="text-emerald-600 border-emerald-100">
        <label className={label}>Instructions</label>
        <textarea className={input} rows={3} value={endOfDayInstructions} onChange={(e) => setEndOfDayInstructions(e.target.value)} />
      </Section>

      {/* Additional Notes */}
      <Section title="Additional Notes" color="text-purple-600 border-purple-100">
        <label className={label}>Anything else the sub should know</label>
        <textarea
          className={input}
          rows={4}
          value={specialNotes}
          onChange={(e) => setSpecialNotes(e.target.value)}
          placeholder="Lunch codes, allergies, special schedules, fire drill procedure…"
        />
      </Section>

      {/* Message for the Sub */}
      <Section title="Message for the Sub" color="text-pink-600 border-pink-100">
        <label className={label}>Printed at the bottom of the plan for the substitute to read</label>
        <textarea
          className={input}
          rows={4}
          value={subFeedbackPrompt}
          onChange={(e) => setSubFeedbackPrompt(e.target.value)}
        />
      </Section>

      <div className="flex justify-end pb-4">
        <button
          type="submit"
          className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-indigo-200/60 hover:from-indigo-600 hover:to-violet-600 hover:shadow-indigo-300/60 transition-all"
        >
          Generate Plan
        </button>
      </div>
    </form>
  );
}
