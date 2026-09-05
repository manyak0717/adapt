import React from "react";
import { CheckCircle2, ArrowRight } from "lucide-react";

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  largeButtons?: boolean;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = "Yes, Continue",
  cancelLabel = "Review Again",
  onConfirm,
  onCancel,
  largeButtons = false,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-[#E5E7EB] text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#635BFF]/10 text-[#635BFF] flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <h3 id="confirmation-dialog-title" className="text-xl sm:text-2xl font-bold text-[#111827] mb-2">
          {title}
        </h3>

        <p className="text-[#64748B] text-base mb-8 leading-relaxed">{message}</p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onCancel}
            className={`w-full sm:flex-1 rounded-2xl border-2 border-[#E5E7EB] font-semibold text-[#111827] hover:bg-[#F7F8FC] transition-colors cursor-pointer ${
              largeButtons ? "py-4 text-lg" : "py-3 text-base"
            }`}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`w-full sm:flex-1 rounded-2xl bg-[#635BFF] hover:bg-[#5046E5] text-white font-semibold flex items-center justify-center gap-2 shadow-md transition-transform active:scale-95 cursor-pointer ${
              largeButtons ? "py-4 text-lg" : "py-3 text-base"
            }`}
          >
            <span>{confirmLabel}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
