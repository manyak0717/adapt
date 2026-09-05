import React, { useState, useEffect } from "react";
import { useAdapt } from "../../context/AdaptContext";
import { Check, Sparkles } from "lucide-react";

export const TaskProcessing: React.FC = () => {
  const { currentTask, setScreen } = useAdapt();

  const [currentStage, setCurrentStage] = useState<number>(0);

  const stages = [
    { title: "Understanding your request", detail: "Analyzing natural language and user intent" },
    { title: "Finding the procedure", detail: "Mapping digital steps and requirements" },
    { title: "Preparing your steps", detail: "Structuring accessible actions and prompts" },
  ];

  useEffect(() => {
    // Stage 1 completes
    const t1 = setTimeout(() => {
      setCurrentStage(1);
    }, 700);

    // Stage 2 completes
    const t2 = setTimeout(() => {
      setCurrentStage(2);
    }, 1500);

    // Stage 3 completes & moves to overview
    const t3 = setTimeout(() => {
      setCurrentStage(3);
    }, 2300);

    const t4 = setTimeout(() => {
      setScreen("overview");
    }, 2900);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [setScreen]);

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-12 sm:py-20 text-center">
      {/* Top AI badge */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#635BFF]/10 text-[#635BFF] text-xs font-semibold uppercase tracking-wider mb-6">
        <Sparkles className="w-3.5 h-3.5 animate-spin" />
        <span>ADAPT Intelligence</span>
      </div>

      <h1 className="text-2xl sm:text-4xl font-bold text-[#111827] tracking-tight mb-3">
        Understanding your goal
      </h1>

      {/* Target prompt */}
      <div className="inline-block bg-white px-5 py-2.5 rounded-2xl border border-[#E5E7EB] shadow-xs text-base sm:text-lg font-medium text-[#635BFF] mb-10 max-w-md truncate">
        "{currentTask?.original_input || "Book a doctor's appointment"}"
      </div>

      {/* Staged checklist card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E7EB] shadow-sm text-left max-w-md mx-auto space-y-5">
        {stages.map((stage, idx) => {
          const isDone = currentStage > idx;
          const isCurrent = currentStage === idx;

          return (
            <div key={stage.title} className="flex items-start gap-4 transition-all duration-300">
              {/* Status icon */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                  isDone
                    ? "bg-[#16A34A] text-white"
                    : isCurrent
                    ? "bg-[#635BFF]/15 text-[#635BFF]"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {isDone ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : isCurrent ? (
                  <div className="w-2.5 h-2.5 rounded-full bg-[#635BFF] animate-ping" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-gray-300" />
                )}
              </div>

              {/* Stage text */}
              <div className="flex-1">
                <p
                  className={`text-sm font-semibold transition-colors ${
                    isDone
                      ? "text-[#111827]"
                      : isCurrent
                      ? "text-[#635BFF] font-bold"
                      : "text-[#64748B]"
                  }`}
                >
                  {stage.title}
                </p>
                <p className="text-xs text-[#64748B] mt-0.5">{stage.detail}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex items-center justify-center gap-2 text-xs text-[#64748B]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#14B8A6] animate-pulse"></span>
        <span>Organizing personalized assistance...</span>
      </div>
    </div>
  );
};
