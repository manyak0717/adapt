import React from "react";
import type { Step, Adaptation } from "../../types";
import {
  Check,
  Building2,
  Hospital,
  Cross,
  Stethoscope,
  HeartPulse,
  Activity,
  Sparkles,
  UserCheck,
  Calendar,
  Clock,
  CalendarCheck,
  Bus,
  Armchair,
  Accessibility,
  Building,
  User,
  Home,
  CreditCard,
  Wallet,
  Zap,
  HelpCircle,
  CheckCircle2,
  MessageSquare,
  Mail,
  Upload,
  FileCheck2,
  Navigation,
  Keyboard as KeyboardIcon,
} from "lucide-react";

// Icon lookup dictionary for dynamic rendering without task-specific conditionals
const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Building2,
  Hospital,
  Cross,
  Stethoscope,
  HeartPulse,
  Activity,
  Sparkles,
  UserCheck,
  Calendar,
  Clock,
  CalendarCheck,
  Bus,
  Armchair,
  Accessibility,
  Building,
  User,
  Home,
  CreditCard,
  Wallet,
  Zap,
  HelpCircle,
  CheckCircle2,
  MessageSquare,
  Mail,
  Upload,
  FileCheck2,
  Navigation,
};

interface StepRendererProps {
  step: Step;
  adaptation: Adaptation | null;
  selectedChoiceId: string | null;
  onSelectChoice: (id: string) => void;
  typedValue: string;
  onTypeChange: (val: string) => void;
  onOpenKeyboard?: () => void;
  isConfirmed: boolean;
  onToggleConfirm: () => void;
  uploadedFileName: string | null;
  onFileUpload: (fileName: string) => void;
}

export const StepRenderer: React.FC<StepRendererProps> = ({
  step,
  adaptation,
  selectedChoiceId,
  onSelectChoice,
  typedValue,
  onTypeChange,
  onOpenKeyboard,
  isConfirmed,
  onToggleConfirm,
  uploadedFileName,
  onFileUpload,
}) => {
  const isLargeButtons = adaptation?.button_size === "large";
  const isSimplified = adaptation?.instruction_mode === "simplified";

  const renderIcon = (iconName?: string) => {
    if (!iconName) return null;
    const IconComponent = ICON_MAP[iconName] || CheckCircle2;
    return <IconComponent className={isLargeButtons ? "w-7 h-7" : "w-5 h-5"} />;
  };

  // 1. CLICK / SELECT ACTIONS
  if (step.action_type === "click" || step.action_type === "select") {
    const choices = step.action_data?.choices || [
      { id: "opt_1", title: "Option 1" },
      { id: "opt_2", title: "Option 2" },
    ];

    return (
      <div
        className="space-y-3 sm:space-y-4"
        role="radiogroup"
        aria-label={step.short_instruction || step.instruction}
      >
        {choices.map((choice) => {
          const isSelected = selectedChoiceId === choice.id;

          return (
            <button
              key={choice.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelectChoice(choice.id)}
              className={`w-full text-left rounded-3xl border-2 transition-all cursor-pointer flex items-center justify-between gap-4 select-none ${
                isLargeButtons
                  ? "p-6 sm:p-7 min-h-[5.5rem]"
                  : "p-4 sm:p-5 min-h-[4.25rem]"
              } ${
                isSelected
                  ? "bg-[#635BFF]/8 border-[#635BFF] shadow-sm"
                  : "bg-white border-[#E5E7EB] hover:border-[#635BFF]/40 hover:bg-[#F7F8FC]"
              }`}
            >
              <div className="flex items-center gap-4 min-w-0">
                {/* Optional icon */}
                {choice.icon && (
                  <div
                    className={`rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                      isLargeButtons ? "w-14 h-14" : "w-11 h-11"
                    } ${
                      isSelected
                        ? "bg-[#635BFF] text-white"
                        : "bg-[#F7F8FC] border border-[#E5E7EB] text-[#635BFF]"
                    }`}
                  >
                    {renderIcon(choice.icon)}
                  </div>
                )}

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`font-bold text-[#111827] leading-tight ${
                        isLargeButtons ? "text-xl sm:text-2xl" : "text-base sm:text-lg"
                      }`}
                    >
                      {choice.title}
                    </span>
                    {choice.badge && (
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#14B8A6]/10 text-[#14B8A6] border border-[#14B8A6]/20">
                        {choice.badge}
                      </span>
                    )}
                  </div>

                  {/* Show description unless in ultra-simplified mode */}
                  {choice.description && !isSimplified && (
                    <p
                      className={`text-[#64748B] mt-1 line-clamp-2 ${
                        isLargeButtons ? "text-sm sm:text-base" : "text-xs sm:text-sm"
                      }`}
                    >
                      {choice.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Selection Checkmark Indicator */}
              <div
                className={`rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${
                  isLargeButtons ? "w-8 h-8" : "w-6 h-6"
                } ${
                  isSelected
                    ? "bg-[#635BFF] border-[#635BFF] text-white"
                    : "border-[#E5E7EB] bg-white"
                }`}
              >
                {isSelected && (
                  <Check className={isLargeButtons ? "w-5 h-5 stroke-[3]" : "w-4 h-4 stroke-[3]"} />
                )}
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  // 2. TYPE ACTION
  if (step.action_type === "type") {
    const choices = step.action_data?.choices;
    const label = step.action_data?.inputLabel || "Enter text";
    const placeholder = step.action_data?.inputPlaceholder || "Type here...";

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm sm:text-base font-bold text-[#111827] mb-2">
            {label}
          </label>
          <div className="relative flex items-center">
            <input
              type={step.action_data?.inputType || "text"}
              value={typedValue}
              onChange={(e) => onTypeChange(e.target.value)}
              placeholder={placeholder}
              className={`w-full rounded-2xl bg-white border-2 border-[#E5E7EB] focus:border-[#635BFF] focus:ring-4 focus:ring-[#635BFF]/10 text-[#111827] transition-all ${
                isLargeButtons ? "py-5 px-6 text-2xl font-bold" : "py-4 px-5 text-lg font-semibold"
              }`}
            />
            {onOpenKeyboard && (
              <button
                type="button"
                onClick={onOpenKeyboard}
                className="absolute right-3 p-2.5 rounded-xl bg-[#F7F8FC] hover:bg-[#E5E7EB] text-[#635BFF] transition-colors cursor-pointer"
                title="Open on-screen keyboard"
                aria-label="Open on-screen keyboard"
              >
                <KeyboardIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Quick select pills or default value fill if provided */}
        {step.action_data?.defaultValue && !typedValue && (
          <div>
            <button
              type="button"
              onClick={() => onTypeChange(step.action_data?.defaultValue || "")}
              className="py-2.5 px-4 rounded-xl bg-[#635BFF]/10 text-[#635BFF] hover:bg-[#635BFF]/15 font-semibold text-xs transition-colors cursor-pointer"
            >
              Use: "{step.action_data.defaultValue}"
            </button>
          </div>
        )}

        {choices && choices.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">
              Or tap a quick amount:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {choices.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onTypeChange(c.title.replace("$", ""))}
                  className="py-3 px-4 rounded-xl bg-white border border-[#E5E7EB] hover:border-[#635BFF] font-bold text-sm text-[#111827] transition-colors cursor-pointer"
                >
                  {c.title}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 3. READ ACTION
  if (step.action_type === "read") {
    return (
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E7EB] shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-lg text-[#111827]">Important Information</h4>
        </div>
        <p className="text-base sm:text-lg text-[#64748B] leading-relaxed">
          {step.instruction}
        </p>
        {step.action_data?.readPoints && (
          <ul className="space-y-2 pt-2">
            {step.action_data.readPoints.map((pt, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm sm:text-base text-[#111827]">
                <Check className="w-5 h-5 text-[#16A34A] shrink-0 mt-0.5" />
                <span>{pt}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  // 4. CONFIRM ACTION
  if (step.action_type === "confirm") {
    const summaryItems = step.action_data?.summaryItems || [];

    return (
      <div className="space-y-5">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E7EB] shadow-xs divide-y divide-gray-100">
          <h4 className="font-bold text-base sm:text-lg text-[#111827] pb-4">
            Summary Overview
          </h4>
          <div className="space-y-3 pt-4">
            {summaryItems.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between gap-4 py-1 text-sm sm:text-base">
                <span className="text-[#64748B] font-medium">{item.label}:</span>
                <span className="text-[#111827] font-bold text-right">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Big confirmation toggle button */}
        <button
          type="button"
          onClick={onToggleConfirm}
          className={`w-full p-5 rounded-2xl border-2 flex items-center gap-3.5 transition-all cursor-pointer select-none ${
            isConfirmed
              ? "bg-[#16A34A]/10 border-[#16A34A] text-[#16A34A]"
              : "bg-white border-[#E5E7EB] hover:border-[#635BFF] text-[#111827]"
          }`}
        >
          <div
            className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-colors ${
              isConfirmed ? "bg-[#16A34A] border-[#16A34A] text-white" : "border-gray-300"
            }`}
          >
            {isConfirmed && <Check className="w-5 h-5 stroke-[3]" />}
          </div>
          <span className="font-bold text-base sm:text-lg">
            I verify that these details are correct
          </span>
        </button>
      </div>
    );
  }

  // 5. UPLOAD ACTION
  if (step.action_type === "upload") {
    return (
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E7EB] shadow-xs text-center">
        {uploadedFileName ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-[#16A34A] flex items-center justify-center">
              <FileCheck2 className="w-8 h-8" />
            </div>
            <p className="font-bold text-lg text-[#111827]">{uploadedFileName}</p>
            <span className="text-xs text-[#16A34A] font-semibold bg-emerald-100/60 px-3 py-1 rounded-full">
              Document Attached & Verified
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onFileUpload("identification_document_verified.pdf")}
            className="w-full py-10 px-6 border-2 border-dashed border-[#E5E7EB] hover:border-[#635BFF] hover:bg-[#635BFF]/5 rounded-2xl flex flex-col items-center gap-3 transition-colors cursor-pointer"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#635BFF]/10 text-[#635BFF] flex items-center justify-center">
              <Upload className="w-7 h-7" />
            </div>
            <div>
              <p className="font-bold text-base sm:text-lg text-[#111827]">
                Tap to upload required document
              </p>
              <p className="text-xs text-[#64748B] mt-1">PDF, PNG, or JPG files accepted</p>
            </div>
          </button>
        )}
      </div>
    );
  }

  // 6. NAVIGATE / OTHER GENERIC ACTION
  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E7EB] shadow-xs text-center space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-[#635BFF]/10 text-[#635BFF] mx-auto flex items-center justify-center">
        <Navigation className="w-6 h-6" />
      </div>
      <h4 className="font-bold text-lg text-[#111827]">Action Ready</h4>
      <p className="text-sm text-[#64748B] max-w-md mx-auto">
        Please verify the action requirement and proceed when ready.
      </p>
      <button
        type="button"
        onClick={onToggleConfirm}
        className={`py-3 px-6 rounded-2xl font-bold border transition-colors cursor-pointer ${
          isConfirmed
            ? "bg-[#16A34A] text-white border-[#16A34A]"
            : "bg-white border-[#E5E7EB] text-[#111827] hover:bg-[#F7F8FC]"
        }`}
      >
        {isConfirmed ? "Action Completed ✓" : "Mark as Completed"}
      </button>
    </div>
  );
};
