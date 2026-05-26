"use client";

import { useState } from "react";
import PlanForm from "@/components/PlanForm";
import PlanPreview from "@/components/PlanPreview";
import { SubPlan } from "@/types/plan";

export default function Home() {
  const [plan, setPlan] = useState<SubPlan | null>(null);

  return (
    <main className="relative min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-10 px-4">
      {/* Ambient background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-indigo-200/40 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-40 w-96 h-96 bg-violet-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-1/4 w-72 h-72 bg-sky-200/30 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-3xl mx-auto">
        {/* Page header */}
        <div className="no-print mb-8 text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">
            Mrs. Yung&apos;s Sub Plan Generator 🍎🐱
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            {plan
              ? "Review and print your substitute teacher plan."
              : "Fill in the details below to generate a printable substitute teacher plan."}
          </p>
        </div>

        {plan ? (
          <PlanPreview plan={plan} onEdit={() => setPlan(null)} />
        ) : (
          <PlanForm onGenerate={setPlan} />
        )}
      </div>
    </main>
  );
}
