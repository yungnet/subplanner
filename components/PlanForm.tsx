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
}

export default function PlanForm({ onGenerate }: PlanFormProps) {
  const [teacherName, setTeacherName] = useState("");
  const [date, setDate] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [room, setRoom] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [attendance, setAttendance] = useState(
    "Take attendance during the first 5 minutes. Mark absences in the grade book on the desk."
  );
  const [rules, setRules] = useState<string[]>(DEFAULT_RULES);
  const [periods, setPeriods] = useState<Period[]>([{ ...EMPTY_PERIOD }]);
  const [studentsToWatch, setStudentsToWatch] = useState("");
  const [endOfDayInstructions, setEndOfDayInstructions] = useState(
    "Ensure all students have their belongings. Dismiss only after the bell rings."
  );
  const [specialNotes, setSpecialNotes] = useState("");

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
      teacherName,
      date,
      gradeLevel,
      room,
      emergencyContact,
      emergencyPhone,
      attendance,
      classroomRules: rules.filter((r) => r.trim() !== ""),
      periods,
      studentsToWatch,
      endOfDayInstructions,
      specialNotes,
    });
  }

  const inputClass =
    "w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400";
  const labelClass = "block text-sm font-semibold text-gray-700 mb-1";
  const sectionClass = "bg-white rounded-lg shadow p-6 space-y-4";
  const sectionTitle = "text-lg font-bold text-gray-800 border-b pb-2 mb-4";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className={sectionClass}>
        <h2 className={sectionTitle}>Basic Info</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Teacher Name</label>
            <input
              className={inputClass}
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              placeholder="Ms. Smith"
              required
            />
          </div>
          <div>
            <label className={labelClass}>Date</label>
            <input
              type="date"
              className={inputClass}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Grade Level</label>
            <input
              className={inputClass}
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              placeholder="5th Grade"
              required
            />
          </div>
          <div>
            <label className={labelClass}>Room Number</label>
            <input
              className={inputClass}
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="Room 204"
              required
            />
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className={sectionClass}>
        <h2 className={sectionTitle}>Emergency Contact</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Contact Name</label>
            <input
              className={inputClass}
              value={emergencyContact}
              onChange={(e) => setEmergencyContact(e.target.value)}
              placeholder="Mrs. Johnson (Team Lead)"
              required
            />
          </div>
          <div>
            <label className={labelClass}>Phone / Extension</label>
            <input
              className={inputClass}
              value={emergencyPhone}
              onChange={(e) => setEmergencyPhone(e.target.value)}
              placeholder="x2045 or (555) 555-1234"
              required
            />
          </div>
        </div>
      </div>

      {/* Attendance */}
      <div className={sectionClass}>
        <h2 className={sectionTitle}>Attendance</h2>
        <label className={labelClass}>Attendance Instructions</label>
        <textarea
          className={inputClass}
          rows={3}
          value={attendance}
          onChange={(e) => setAttendance(e.target.value)}
        />
      </div>

      {/* Daily Schedule */}
      <div className={sectionClass}>
        <h2 className={sectionTitle}>Daily Schedule</h2>
        <div className="space-y-4">
          {periods.map((period, index) => (
            <div key={index} className="border border-gray-200 rounded p-4 bg-gray-50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-600 text-sm">Period {index + 1}</span>
                {periods.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePeriod(index)}
                    className="text-red-500 text-sm hover:text-red-700"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Time</label>
                  <input
                    className={inputClass}
                    value={period.time}
                    onChange={(e) => updatePeriod(index, "time", e.target.value)}
                    placeholder="8:00 – 8:45 AM"
                  />
                </div>
                <div>
                  <label className={labelClass}>Subject</label>
                  <input
                    className={inputClass}
                    value={period.subject}
                    onChange={(e) => updatePeriod(index, "subject", e.target.value)}
                    placeholder="Math"
                  />
                </div>
                <div>
                  <label className={labelClass}>Activity / Instructions</label>
                  <input
                    className={inputClass}
                    value={period.activity}
                    onChange={(e) => updatePeriod(index, "activity", e.target.value)}
                    placeholder="Complete worksheet on desks"
                  />
                </div>
                <div>
                  <label className={labelClass}>Location</label>
                  <input
                    className={inputClass}
                    value={period.location}
                    onChange={(e) => updatePeriod(index, "location", e.target.value)}
                    placeholder="Classroom / Gym / Library"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addPeriod}
          className="mt-3 text-blue-600 text-sm font-semibold hover:text-blue-800"
        >
          + Add Period
        </button>
      </div>

      {/* Classroom Rules */}
      <div className={sectionClass}>
        <h2 className={sectionTitle}>Classroom Rules</h2>
        <div className="space-y-2">
          {rules.map((rule, index) => (
            <div key={index} className="flex gap-2 items-center">
              <input
                className={`${inputClass} flex-1`}
                value={rule}
                onChange={(e) => updateRule(index, e.target.value)}
                placeholder="Enter a classroom rule"
              />
              <button
                type="button"
                onClick={() => removeRule(index)}
                className="text-red-500 text-sm hover:text-red-700 shrink-0"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addRule}
          className="mt-3 text-blue-600 text-sm font-semibold hover:text-blue-800"
        >
          + Add Rule
        </button>
      </div>

      {/* Students Needing Attention */}
      <div className={sectionClass}>
        <h2 className={sectionTitle}>Students Needing Attention</h2>
        <label className={labelClass}>Notes on specific students</label>
        <textarea
          className={inputClass}
          rows={4}
          value={studentsToWatch}
          onChange={(e) => setStudentsToWatch(e.target.value)}
          placeholder="e.g. Alex – may need help staying focused; Jordan – has an IEP, sits near front"
        />
      </div>

      {/* End of Day */}
      <div className={sectionClass}>
        <h2 className={sectionTitle}>End of Day</h2>
        <label className={labelClass}>End of Day Instructions</label>
        <textarea
          className={inputClass}
          rows={3}
          value={endOfDayInstructions}
          onChange={(e) => setEndOfDayInstructions(e.target.value)}
        />
      </div>

      {/* Additional Notes */}
      <div className={sectionClass}>
        <h2 className={sectionTitle}>Additional Notes</h2>
        <label className={labelClass}>Anything else the sub should know</label>
        <textarea
          className={inputClass}
          rows={4}
          value={specialNotes}
          onChange={(e) => setSpecialNotes(e.target.value)}
          placeholder="Lunch codes, allergies, special schedules, fire drill procedure…"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Generate Plan
        </button>
      </div>
    </form>
  );
}
