"use client";

import { useRef, useState } from "react";
import PlanForm from "@/components/PlanForm";
import PlanPreview from "@/components/PlanPreview";
import { GeneratedWorksheet, SubPlan } from "@/types/plan";

interface SavedPackage {
  plan: SubPlan;
  worksheets: GeneratedWorksheet[];
}

export default function Home() {
  const [plan, setPlan] = useState<SubPlan | null>(null);
  const [worksheets, setWorksheets] = useState<GeneratedWorksheet[]>([]);
  const [editValues, setEditValues] = useState<SubPlan | undefined>(undefined);
  const [editWorksheets, setEditWorksheets] = useState<GeneratedWorksheet[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleGenerate(newPlan: SubPlan, newWorksheets: GeneratedWorksheet[]) {
    setPlan(newPlan);
    setWorksheets(newWorksheets);
    setEditValues(undefined);
    setEditWorksheets([]);
  }

  function handleEdit() {
    setEditValues(plan ?? undefined);
    setEditWorksheets(worksheets);
    setPlan(null);
    setWorksheets([]);
  }

  function handleOpenSaved() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        // Support both old format (plain SubPlan) and new format ({ plan, worksheets })
        const raw = JSON.parse(ev.target?.result as string);
        const loaded: SavedPackage = "plan" in raw
          ? raw
          : { plan: raw as SubPlan, worksheets: [] };
        setEditValues(undefined);
        setEditWorksheets([]);
        setPlan(loaded.plan);
        setWorksheets(loaded.worksheets ?? []);
      } catch {
        alert("Couldn't read that file — make sure it's a saved plan.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <main className="relative min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-10 px-4">
      {/* Ambient blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-indigo-200/40 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-40 w-96 h-96 bg-violet-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-1/4 w-72 h-72 bg-sky-200/30 rounded-full blur-3xl" />
      </div>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileChange} />

      <div className="relative max-w-3xl mx-auto">
        {/* Header */}
        <div className="no-print mb-8">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">
              Mrs. Yung&apos;s Sub Plan Generator 🍎🐱
            </h1>
            {!plan && (
              <button
                onClick={handleOpenSaved}
                className="shrink-0 bg-white/50 backdrop-blur-sm border border-white/70 text-gray-600 text-sm px-4 py-2 rounded-xl font-semibold hover:bg-white/80 transition-all"
              >
                📂 Open Saved Plan
              </button>
            )}
          </div>
          <p className="text-gray-500 text-sm mt-2">
            {plan ? "Review and print your substitute teacher plan." : "Fill in the details below to generate a printable substitute teacher plan."}
          </p>
        </div>

        {plan ? (
          <PlanPreview plan={plan} worksheets={worksheets} onEdit={handleEdit} />
        ) : (
          <PlanForm onGenerate={handleGenerate} initialValues={editValues} initialWorksheets={editWorksheets} />
        )}
      </div>
    </main>
  );
}
