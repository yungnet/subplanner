"use client";

import { useState } from "react";
import { DetectedMaterial, GeneratedWorksheet, Period, SubPlan } from "@/types/plan";

type AiStatus = "idle" | "loading" | "detecting" | "success" | "not_configured" | "error";
type WsStatus = "idle" | "loading" | "done" | "error";

const DEFAULT_RULES = [
  "Raise your hand before speaking.",
  "Stay in your seat unless given permission to move.",
  "Respect all classmates and adults.",
  "No phones or personal devices during instruction.",
  "Follow all school rules at all times.",
];

const EMPTY_PERIOD: Period = { time: "", subject: "", activity: "", location: "" };

interface PlanFormProps {
  onGenerate: (plan: SubPlan, worksheets: GeneratedWorksheet[]) => void;
  initialValues?: SubPlan;
  initialWorksheets?: GeneratedWorksheet[];
}

const input =
  "w-full bg-white/70 border border-gray-300/80 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:bg-white/90 transition-all";

const label = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5";

function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/40 backdrop-blur-2xl border border-white/60 rounded-2xl shadow-lg shadow-black/5 p-6 space-y-4">
      <h2 className={`text-base font-bold border-b pb-2 mb-1 ${color}`}>{title}</h2>
      {children}
    </div>
  );
}

const AI_STATUS_UI: Partial<Record<AiStatus, { text: string; className: string }>> = {
  success:        { text: "✅ Plan fields filled in — review and adjust below.", className: "bg-emerald-50 border border-emerald-200 text-emerald-700" },
  not_configured: { text: "⚙️ AI generation isn't active yet. Add your ANTHROPIC_API_KEY to .env.local to enable.", className: "bg-amber-50 border border-amber-200 text-amber-700" },
  error:          { text: "❌ Something went wrong. The plan fields were not changed.", className: "bg-rose-50 border border-rose-200 text-rose-700" },
};

export default function PlanForm({ onGenerate, initialValues, initialWorksheets }: PlanFormProps) {
  // ── Form state ─────────────────────────────────────────────────────────────
  const [date, setDate] = useState(initialValues?.date ?? "");
  const [gradeLevel, setGradeLevel] = useState(initialValues?.gradeLevel ?? "");
  const [room, setRoom] = useState(initialValues?.room ?? "");
  const [attendance, setAttendance] = useState(initialValues?.attendance ?? "Take attendance during the first 5 minutes. Mark absences in the grade book on the desk.");
  const [rules, setRules] = useState<string[]>(initialValues?.classroomRules ?? DEFAULT_RULES);
  const [periods, setPeriods] = useState<Period[]>(initialValues?.periods ?? [{ ...EMPTY_PERIOD }]);
  const [studentsToWatch, setStudentsToWatch] = useState(initialValues?.studentsToWatch ?? "");
  const [endOfDayInstructions, setEndOfDayInstructions] = useState(initialValues?.endOfDayInstructions ?? "Ensure all students have their belongings. Dismiss only after the bell rings.");
  const [specialNotes, setSpecialNotes] = useState(initialValues?.specialNotes ?? "");
  const [subFeedbackPrompt, setSubFeedbackPrompt] = useState(
    initialValues?.subFeedbackPrompt ??
    "Thank you for coming in for me today! Please leave me detailed notes about how the day went and include any names of helpful students (or students you think I should know about). You can also send me an email at Jodie.Yung@ecsd.net"
  );

  // ── AI state ───────────────────────────────────────────────────────────────
  const [curriculumNotes, setCurriculumNotes] = useState("");
  const [toneNotes, setToneNotes] = useState("");
  const [aiStatus, setAiStatus] = useState<AiStatus>("idle");

  // Materials detection
  const [detectedMaterials, setDetectedMaterials] = useState<DetectedMaterial[]>([]);
  const [detectDone, setDetectDone] = useState(false);

  // Worksheets
  const [wsStatus, setWsStatus] = useState<Record<string, WsStatus>>({});
  const [generatedWorksheets, setGeneratedWorksheets] = useState<GeneratedWorksheet[]>(initialWorksheets ?? []);

  // ── Period helpers ─────────────────────────────────────────────────────────
  const updatePeriod = (i: number, field: keyof Period, val: string) =>
    setPeriods((prev) => prev.map((p, idx) => (idx === i ? { ...p, [field]: val } : p)));
  const addPeriod = () => setPeriods((prev) => [...prev, { ...EMPTY_PERIOD }]);
  const removePeriod = (i: number) => setPeriods((prev) => prev.filter((_, idx) => idx !== i));

  // ── Rule helpers ───────────────────────────────────────────────────────────
  const updateRule = (i: number, val: string) =>
    setRules((prev) => prev.map((r, idx) => (idx === i ? val : r)));
  const addRule = () => setRules((prev) => [...prev, ""]);
  const removeRule = (i: number) => setRules((prev) => prev.filter((_, idx) => idx !== i));

  // ── AI: generate plan ──────────────────────────────────────────────────────
  async function handleAiGenerate() {
    if (!curriculumNotes.trim()) return;
    setAiStatus("loading");
    setDetectedMaterials([]);
    setDetectDone(false);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ curriculumNotes, gradeLevel, toneNotes }),
      });

      if (res.status === 503) { setAiStatus("not_configured"); return; }
      if (!res.ok) { setAiStatus("error"); return; }

      const data = await res.json();
      if (data.periods?.length) setPeriods(data.periods);
      if (data.attendance) setAttendance(data.attendance);
      if (data.endOfDayInstructions) setEndOfDayInstructions(data.endOfDayInstructions);
      if (data.specialNotes) setSpecialNotes(data.specialNotes);

      setAiStatus("detecting");

      // Second pass: detect missing materials
      await runDetection({
        periods: data.periods || [],
        attendance: data.attendance || "",
        endOfDayInstructions: data.endOfDayInstructions || "",
        specialNotes: data.specialNotes || "",
      });

      setAiStatus("success");
    } catch {
      setAiStatus("error");
    }
  }

  async function runDetection(generated: {
    periods: Period[];
    attendance: string;
    endOfDayInstructions: string;
    specialNotes: string;
  }) {
    try {
      const res = await fetch("/api/detect-materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...generated, curriculumNotes, gradeLevel }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setDetectedMaterials(data.materials ?? []);
    } finally {
      setDetectDone(true);
    }
  }

  // ── AI: generate one worksheet ─────────────────────────────────────────────
  async function generateWorksheet(material: DetectedMaterial) {
    setWsStatus((prev) => ({ ...prev, [material.id]: "loading" }));
    try {
      const res = await fetch("/api/generate-worksheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ material, gradeLevel, curriculumNotes }),
      });
      if (!res.ok) { setWsStatus((prev) => ({ ...prev, [material.id]: "error" })); return; }
      const data = await res.json();
      if (data.worksheet) {
        setGeneratedWorksheets((prev) => {
          const filtered = prev.filter((w) => w.materialId !== material.id);
          return [...filtered, data.worksheet];
        });
      }
      setWsStatus((prev) => ({ ...prev, [material.id]: "done" }));
    } catch {
      setWsStatus((prev) => ({ ...prev, [material.id]: "error" }));
    }
  }

  async function generateAllWorksheets() {
    for (const material of detectedMaterials) {
      if (wsStatus[material.id] !== "done") {
        await generateWorksheet(material);
      }
    }
  }

  const allGenerated =
    detectedMaterials.length > 0 && detectedMaterials.every((m) => wsStatus[m.id] === "done");
  const anyLoading = Object.values(wsStatus).some((s) => s === "loading");

  // ── Submit ─────────────────────────────────────────────────────────────────
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onGenerate(
      {
        date, gradeLevel, room, attendance,
        classroomRules: rules.filter((r) => r.trim() !== ""),
        periods, studentsToWatch, endOfDayInstructions, specialNotes, subFeedbackPrompt,
      },
      generatedWorksheets
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* ── AI Plan Assistant (Beta) ─────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-indigo-50/70 to-violet-50/70 backdrop-blur-2xl border border-indigo-200/60 rounded-2xl shadow-lg shadow-indigo-100/20 p-6 space-y-4">
        <div className="flex items-center gap-2.5 border-b border-indigo-100 pb-2.5">
          <h2 className="text-base font-bold text-indigo-600">✨ AI Plan Assistant</h2>
          <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full tracking-wide">Beta</span>
        </div>
        <p className="text-xs text-indigo-400">
          Describe what you&apos;re teaching and let AI draft the schedule, attendance, and end-of-day fields. It will also detect any worksheets you&apos;d need to print.
        </p>

        <div>
          <label className={label}>What are students learning today?</label>
          <textarea
            className={`${input} border-indigo-200/80 focus:ring-indigo-300`}
            rows={4}
            value={curriculumNotes}
            onChange={(e) => { setCurriculumNotes(e.target.value); setAiStatus("idle"); }}
            placeholder="e.g. Math: Chapter 6 fractions — students complete pages 112–114. Science: finish the water cycle diagram. Gym at 1:30 with Mr. Tanaka."
          />
        </div>

        <div>
          <label className={label}>Style notes <span className="normal-case font-normal text-gray-400">(optional)</span></label>
          <input
            className={`${input} border-indigo-200/80 focus:ring-indigo-300`}
            value={toneNotes}
            onChange={(e) => setToneNotes(e.target.value)}
            placeholder="e.g. Keep instructions very simple, this class needs lots of structure"
          />
        </div>

        {/* Status message */}
        {aiStatus !== "idle" && aiStatus !== "loading" && aiStatus !== "detecting" && AI_STATUS_UI[aiStatus] && (
          <p className={`text-xs rounded-xl px-4 py-2.5 ${AI_STATUS_UI[aiStatus]!.className}`}>
            {AI_STATUS_UI[aiStatus]!.text}
          </p>
        )}

        {/* Generate button */}
        <button
          type="button"
          onClick={handleAiGenerate}
          disabled={aiStatus === "loading" || aiStatus === "detecting" || !curriculumNotes.trim()}
          className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 text-white py-2.5 rounded-xl font-semibold shadow-md shadow-indigo-200/50 hover:from-indigo-600 hover:to-violet-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {(aiStatus === "loading" || aiStatus === "detecting") ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              {aiStatus === "detecting" ? "Detecting materials…" : "Generating plan…"}
            </>
          ) : "✨ Generate with AI"}
        </button>

        {/* ── Materials detected ─────────────────────────────────────────── */}
        {detectDone && detectedMaterials.length > 0 && (
          <div className="border-t border-indigo-100 pt-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-sm font-bold text-indigo-700">
                📋 Materials needed ({detectedMaterials.length})
              </p>
              {detectedMaterials.length > 1 && (
                <button
                  type="button"
                  onClick={generateAllWorksheets}
                  disabled={anyLoading || allGenerated}
                  className="text-xs font-semibold bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {anyLoading ? "Generating…" : allGenerated ? "✓ All Generated" : "Generate All Worksheets"}
                </button>
              )}
            </div>
            <p className="text-xs text-indigo-400">
              AI detected activities that require printed worksheets. Generate them now to include in your download.
            </p>
            <div className="space-y-2">
              {detectedMaterials.map((material) => {
                const status = wsStatus[material.id] ?? "idle";
                return (
                  <div key={material.id} className="flex items-center justify-between gap-3 bg-white/50 rounded-xl px-4 py-3 border border-indigo-100">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{material.title}</p>
                      <p className="text-xs text-gray-500 truncate">{material.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => generateWorksheet(material)}
                      disabled={status === "loading" || status === "done"}
                      className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                        status === "done"
                          ? "bg-emerald-100 text-emerald-700 cursor-default"
                          : status === "loading"
                          ? "bg-indigo-100 text-indigo-500 cursor-wait"
                          : status === "error"
                          ? "bg-rose-100 text-rose-600 hover:bg-rose-200"
                          : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                      }`}
                    >
                      {status === "done" ? "✓ Generated" : status === "loading" ? "Generating…" : status === "error" ? "Retry" : "Generate Worksheet"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {detectDone && detectedMaterials.length === 0 && aiStatus === "success" && (
          <p className="text-xs text-indigo-400 border-t border-indigo-100 pt-3">
            ✓ No additional printed materials detected for this plan.
          </p>
        )}
      </div>

      {/* ── Basic Info ──────────────────────────────────────────────────────── */}
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

      {/* ── Attendance ──────────────────────────────────────────────────────── */}
      <Section title="Attendance" color="text-teal-600 border-teal-100">
        <label className={label}>Instructions</label>
        <textarea className={input} rows={3} value={attendance} onChange={(e) => setAttendance(e.target.value)} />
      </Section>

      {/* ── Daily Schedule ──────────────────────────────────────────────────── */}
      <Section title="Daily Schedule" color="text-violet-600 border-violet-100">
        <div className="space-y-3">
          {periods.map((period, index) => (
            <div key={index} className="bg-white/30 border border-gray-200/70 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-violet-500 uppercase tracking-wider">Period {index + 1}</span>
                {periods.length > 1 && (
                  <button type="button" onClick={() => removePeriod(index)} className="text-xs text-rose-500 font-semibold hover:text-rose-700 transition-colors">Remove</button>
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
        <button type="button" onClick={addPeriod} className="text-sm text-violet-600 font-semibold hover:text-violet-800 transition-colors">+ Add Period</button>
      </Section>

      {/* ── Classroom Rules ─────────────────────────────────────────────────── */}
      <Section title="Classroom Rules" color="text-amber-600 border-amber-100">
        <div className="space-y-2">
          {rules.map((rule, index) => (
            <div key={index} className="flex gap-2 items-center">
              <input className={`${input} flex-1`} value={rule} onChange={(e) => updateRule(index, e.target.value)} placeholder="Enter a classroom rule" />
              <button type="button" onClick={() => removeRule(index)} className="text-xs text-rose-500 font-semibold hover:text-rose-700 shrink-0 transition-colors">Remove</button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addRule} className="text-sm text-amber-600 font-semibold hover:text-amber-800 transition-colors">+ Add Rule</button>
      </Section>

      {/* ── Students ────────────────────────────────────────────────────────── */}
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

      {/* ── End of Day ──────────────────────────────────────────────────────── */}
      <Section title="End of Day" color="text-emerald-600 border-emerald-100">
        <label className={label}>Instructions</label>
        <textarea className={input} rows={3} value={endOfDayInstructions} onChange={(e) => setEndOfDayInstructions(e.target.value)} />
      </Section>

      {/* ── Additional Notes ────────────────────────────────────────────────── */}
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

      {/* ── Message for the Sub ─────────────────────────────────────────────── */}
      <Section title="Message for the Sub" color="text-pink-600 border-pink-100">
        <label className={label}>Printed at the bottom of the plan for the substitute to read</label>
        <textarea className={input} rows={4} value={subFeedbackPrompt} onChange={(e) => setSubFeedbackPrompt(e.target.value)} />
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
