"use client";

import { useState } from "react";
import PlanForm from "@/components/PlanForm";
import PlanPreview from "@/components/PlanPreview";
import { SubPlan } from "@/types/plan";

export default function Home() {
  const [plan, setPlan] = useState<SubPlan | null>(null);

  function handleGenerate(newPlan: SubPlan) {
    setPlan(newPlan);
  }

  function handleEdit() {
    setPlan(null);
  }

  return (
    <main className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="no-print mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Sub Plan Generator</h1>
          <p className="text-gray-500 text-sm mt-1">
            {plan
              ? "Review and print your substitute teacher plan."
              : "Fill in the details below to generate a printable substitute teacher plan."}
          </p>
        </div>

        {plan ? (
          <PlanPreview plan={plan} onEdit={handleEdit} />
        ) : (
          <PlanForm onGenerate={handleGenerate} />
        )}
      </div>
    </main>
  );
}
