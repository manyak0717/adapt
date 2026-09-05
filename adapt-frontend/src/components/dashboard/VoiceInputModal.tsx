import React, { useEffect, useState } from "react";
import { Mic, MicOff, Check, X, RotateCcw, Volume2 } from "lucide-react";
import { useVoiceRecognition } from "../../hooks/useVoiceRecognition";

interface VoiceInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (text: string) => void;
  initialPromptSuggestion?: string;
}

export const VoiceInputModal: React.FC<VoiceInputModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialPromptSuggestion = "I want to book a doctor's appointment",
}) => {
  const [confirmedText, setConfirmedText] = useState("");

  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    setTranscript,
  } = useVoiceRecognition({
    mockFallbackPhrase: initialPromptSuggestion,
    onResult: (finalText) => {
      setConfirmedText(finalText);
    },
  });

  useEffect(() => {
    if (isOpen) {
      setConfirmedText("");
      resetTranscript();
      startListening();
    } else {
      stopListening();
    }
  }, [isOpen, startListening, stopListening, resetTranscript]);

  // Keep confirmed text synced with live transcript if available
  useEffect(() => {
    if (transcript) {
      setConfirmedText(transcript);
    }
  }, [transcript]);

  if (!isOpen) return null;

  const handleUseThis = () => {
    const textToSubmit = confirmedText.trim() || initialPromptSuggestion;
    onSubmit(textToSubmit);
    onClose();
  };

  const handleTryAgain = () => {
    setConfirmedText("");
    resetTranscript();
    startListening();
  };

  const handleSelectQuickPrompt = (phrase: string) => {
    stopListening();
    setConfirmedText(phrase);
    setTranscript(phrase);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Voice input assistant"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-[#E5E7EB] text-center relative overflow-hidden">
        {/* Close icon */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-[#64748B] hover:text-[#111827] hover:bg-[#F7F8FC] transition-colors"
          aria-label="Close voice input"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Listening indicator */}
        <div className="mt-2 mb-6">
          <div className="relative inline-flex items-center justify-center">
            <div
              className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                isListening
                  ? "bg-gradient-to-tr from-[#635BFF] to-[#14B8A6] text-white shadow-lg shadow-[#635BFF]/30 scale-105"
                  : "bg-[#F7F8FC] border-2 border-[#E5E7EB] text-[#635BFF]"
              }`}
            >
              <Mic className={`w-10 h-10 ${isListening ? "animate-pulse" : ""}`} />
            </div>
            {isListening && (
              <span className="absolute -inset-2 rounded-full border-2 border-[#635BFF]/30 animate-ping" />
            )}
          </div>

          <h3 className="text-2xl font-bold text-[#111827] mt-5 mb-1">
            {isListening ? "Listening..." : "Voice captured"}
          </h3>
          <p className="text-sm text-[#64748B]">
            {isListening ? "Tell me what you'd like to do." : "Check what we heard below."}
          </p>

          {/* Animated Waveform */}
          {isListening && (
            <div className="flex items-center justify-center gap-1.5 h-12 mt-4" aria-hidden="true">
              <span className="w-1.5 bg-[#635BFF] rounded-full animate-wave-1"></span>
              <span className="w-1.5 bg-[#14B8A6] rounded-full animate-wave-2"></span>
              <span className="w-1.5 bg-[#635BFF] rounded-full animate-wave-3"></span>
              <span className="w-1.5 bg-[#14B8A6] rounded-full animate-wave-4"></span>
              <span className="w-1.5 bg-[#635BFF] rounded-full animate-wave-5"></span>
              <span className="w-1.5 bg-[#14B8A6] rounded-full animate-wave-2"></span>
              <span className="w-1.5 bg-[#635BFF] rounded-full animate-wave-1"></span>
            </div>
          )}
        </div>

        {/* Live / Confirmed Transcription Card */}
        <div className="bg-[#F7F8FC] rounded-2xl p-5 border border-[#E5E7EB] mb-6 min-h-[5rem] flex items-center justify-center text-center">
          <p className="text-lg font-medium text-[#111827] italic">
            "{confirmedText || transcript || "Speak now or choose a suggestion below..."}"
          </p>
        </div>

        {/* Quick voice simulation suggestions (accessible for quiet environments or hackathon demo) */}
        <div className="mb-6 text-left">
          <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-[#635BFF]" /> Demo speech presets:
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              "I want to book a doctor's appointment",
              "Book a bus ticket",
              "Make a bank transfer",
            ].map((phrase) => (
              <button
                key={phrase}
                type="button"
                onClick={() => handleSelectQuickPrompt(phrase)}
                className="text-xs py-1.5 px-3 rounded-lg bg-white border border-[#E5E7EB] text-[#111827] hover:border-[#635BFF] hover:bg-[#635BFF]/5 transition-colors cursor-pointer"
              >
                "{phrase}"
              </button>
            ))}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          {isListening ? (
            <>
              <button
                onClick={stopListening}
                className="flex-1 py-3.5 px-5 rounded-2xl border border-[#E5E7EB] text-[#111827] font-semibold hover:bg-[#F7F8FC] flex items-center justify-center gap-2 cursor-pointer"
              >
                <MicOff className="w-4 h-4 text-[#EF4444]" />
                <span>Stop</span>
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3.5 px-5 rounded-2xl border border-[#E5E7EB] text-[#64748B] font-medium hover:bg-[#F7F8FC] cursor-pointer"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleTryAgain}
                className="py-3.5 px-5 rounded-2xl border border-[#E5E7EB] text-[#111827] font-semibold hover:bg-[#F7F8FC] flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Try again</span>
              </button>
              <button
                onClick={handleUseThis}
                className="flex-1 py-3.5 px-6 rounded-2xl bg-[#635BFF] hover:bg-[#5046E5] text-white font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <Check className="w-5 h-5" />
                <span>Use this</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
