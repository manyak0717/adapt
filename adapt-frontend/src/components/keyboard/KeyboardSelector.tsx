import React from "react";
import { NormalKeyboard } from "./NormalKeyboard";
import { SimpleKeyboard } from "./SimpleKeyboard";
import { X, Sparkles } from "lucide-react";

interface KeyboardSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  activeMode: "normal" | "simplified";
  onModeChange: (mode: "normal" | "simplified") => void;
  currentValue: string;
  onChar: (char: string) => void;
  onBackspace: () => void;
  onSpace: () => void;
  onSubmit: () => void;
}

export const KeyboardSelector: React.FC<KeyboardSelectorProps> = ({
  isOpen,
  onClose,
  activeMode,
  onModeChange,
  currentValue,
  onChar,
  onBackspace,
  onSpace,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="On-screen Keyboard"
      className="fixed inset-x-0 bottom-0 z-50 bg-white/95 backdrop-blur-md border-t border-[#E5E7EB] shadow-2xl p-4 transition-all duration-300 animate-slide-up"
    >
      <div className="max-w-3xl mx-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] mb-3">
          {/* Mode Switcher */}
          <div className="flex items-center gap-1.5 bg-[#F7F8FC] p-1 rounded-xl border border-[#E5E7EB]">
            <button
              type="button"
              onClick={() => onModeChange("normal")}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeMode === "normal"
                  ? "bg-white text-[#111827] shadow-sm"
                  : "text-[#64748B] hover:text-[#111827]"
              }`}
            >
              Normal Keyboard
            </button>
            <button
              type="button"
              onClick={() => onModeChange("simplified")}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeMode === "simplified"
                  ? "bg-[#635BFF] text-white shadow-sm"
                  : "text-[#64748B] hover:text-[#111827]"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simplified (Large)</span>
            </button>
          </div>

          {/* Current typing preview */}
          <div className="hidden sm:block flex-1 mx-4 px-3 py-1.5 bg-[#F7F8FC] rounded-xl text-sm font-medium text-[#111827] truncate border border-[#E5E7EB]">
            {currentValue || <span className="text-[#64748B] italic">Start typing...</span>}
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#64748B] hover:text-[#111827] hover:bg-[#F7F8FC] transition-colors cursor-pointer"
            aria-label="Close keyboard"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Keyboard Renderer */}
        {activeMode === "simplified" ? (
          <SimpleKeyboard
            onChar={onChar}
            onBackspace={onBackspace}
            onSpace={onSpace}
            onSubmit={onSubmit}
          />
        ) : (
          <NormalKeyboard
            onChar={onChar}
            onBackspace={onBackspace}
            onSpace={onSpace}
            onSubmit={onSubmit}
          />
        )}
      </div>
    </div>
  );
};
