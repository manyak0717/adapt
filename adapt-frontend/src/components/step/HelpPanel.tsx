import React, { useState } from "react";
import { Volume2, Lightbulb, BookOpen, ArrowLeft, X, HelpCircle } from "lucide-react";
import type { Step } from "../../types";

interface HelpPanelProps {
  step: Step;
  onHelpRequested: () => void;
  onReadAloud: () => void;
  onGoBack: () => void;
}

export const HelpPanel: React.FC<HelpPanelProps> = ({
  step,
  onHelpRequested,
  onReadAloud,
  onGoBack,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeHelpMode, setActiveHelpMode] = useState<"none" | "simple" | "detail">("none");

  const handleOpen = () => {
    setIsOpen(true);
    onHelpRequested();
  };

  const handleOptionClick = (option: "hear" | "explain" | "detail" | "back") => {
    onHelpRequested();
    if (option === "hear") {
      onReadAloud();
    } else if (option === "explain") {
      setActiveHelpMode("simple");
    } else if (option === "detail") {
      setActiveHelpMode("detail");
    } else if (option === "back") {
      onGoBack();
    }
  };

  return (
    <div className="mt-4">
      {!isOpen ? (
        <button
          type="button"
          onClick={handleOpen}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#64748B] hover:text-[#635BFF] py-2 px-3 rounded-xl hover:bg-[#F7F8FC] transition-colors cursor-pointer"
          aria-expanded={false}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Need help?</span>
        </button>
      ) : (
        <div
          role="region"
          aria-label="Help and Assistance"
          className="rounded-3xl p-5 sm:p-6 bg-[#F7F8FC] border border-[#E5E7EB] shadow-xs text-left animate-fade-in"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#635BFF]/10 text-[#635BFF]">
                <HelpCircle className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-[#111827]">
                Let's make this easier.
              </h2>
            </div>
            <button
              onClick={() => {
                setIsOpen(false);
                setActiveHelpMode("none");
              }}
              className="p-1 rounded-lg text-[#64748B] hover:text-[#111827] hover:bg-white"
              aria-label="Close help options"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs sm:text-sm text-[#64748B] mb-4">
            Pick what would help you right now:
          </p>

          {/* 4 Standard options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
            {/* 1. Hear this step */}
            <button
              type="button"
              onClick={() => handleOptionClick("hear")}
              className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-[#E5E7EB] hover:border-[#635BFF] hover:bg-[#635BFF]/5 text-left transition-all cursor-pointer"
            >
              <div className="p-2 rounded-xl bg-purple-50 text-[#635BFF]">
                <Volume2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#111827]">Hear this step</p>
                <p className="text-xs text-[#64748B]">Read aloud in clear speech</p>
              </div>
            </button>

            {/* 2. Explain it differently */}
            <button
              type="button"
              onClick={() => handleOptionClick("explain")}
              className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                activeHelpMode === "simple"
                  ? "bg-[#635BFF]/10 border-[#635BFF]"
                  : "bg-white border-[#E5E7EB] hover:border-[#635BFF] hover:bg-[#635BFF]/5"
              }`}
            >
              <div className="p-2 rounded-xl bg-amber-50 text-[#F59E0B]">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#111827]">Explain differently</p>
                <p className="text-xs text-[#64748B]">Plain English breakdown</p>
              </div>
            </button>

            {/* 3. Show more detail */}
            <button
              type="button"
              onClick={() => handleOptionClick("detail")}
              className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                activeHelpMode === "detail"
                  ? "bg-[#635BFF]/10 border-[#635BFF]"
                  : "bg-white border-[#E5E7EB] hover:border-[#635BFF] hover:bg-[#635BFF]/5"
              }`}
            >
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#111827]">Show more detail</p>
                <p className="text-xs text-[#64748B]">Background and tips</p>
              </div>
            </button>

            {/* 4. Go back */}
            <button
              type="button"
              onClick={() => handleOptionClick("back")}
              className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-[#E5E7EB] hover:bg-gray-100 text-left transition-all cursor-pointer"
            >
              <div className="p-2 rounded-xl bg-gray-100 text-[#64748B]">
                <ArrowLeft className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#111827]">Go back</p>
                <p className="text-xs text-[#64748B]">Return to previous step</p>
              </div>
            </button>
          </div>

          {/* Dynamic explanation response box */}
          {activeHelpMode === "simple" && (
            <div className="p-4 rounded-2xl bg-white border border-[#635BFF]/20 text-sm animate-fade-in">
              <p className="font-bold text-[#635BFF] mb-1">Simple Explanation:</p>
              <p className="text-[#111827]">
                All you need to do here is:{" "}
                <span className="font-semibold">{step.short_instruction || step.instruction}</span>.
                Tap on any item card that looks right for you, then press Next.
              </p>
            </div>
          )}

          {activeHelpMode === "detail" && (
            <div className="p-4 rounded-2xl bg-white border border-blue-200 text-sm animate-fade-in">
              <p className="font-bold text-blue-700 mb-1">Detailed Context:</p>
              <p className="text-[#64748B] mb-2 leading-relaxed">{step.instruction}</p>
              <p className="text-xs text-[#64748B]">
                • Action required: <span className="font-semibold capitalize">{step.action_type}</span>
                <br />• Your choice will be saved securely before you proceed.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
