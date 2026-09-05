import React, { useEffect, useState } from "react";
import { Mic, MicOff, Check, X, RotateCcw, Volume2, AlertCircle } from "lucide-react";
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
  const [capturedText, setCapturedText] = useState("");

  const {
    isListening,
    transcript,
    errorType,
    errorMessage,
    startListening,
    stopListening,
    resetTranscript,
    simulateSpeech,
  } = useVoiceRecognition({
    mockFallbackPhrase: initialPromptSuggestion,
    onResult: (finalText) => {
      setCapturedText(finalText);
    },
  });

  // Start listening when opened, stop when closed
  useEffect(() => {
    if (isOpen) {
      setCapturedText("");
      resetTranscript();
      startListening();
    } else {
      stopListening();
    }
  }, [isOpen]);

  // Keep capturedText in sync with interim transcript while speaking
  useEffect(() => {
    if (transcript) {
      setCapturedText(transcript);
    }
  }, [transcript]);

  if (!isOpen) return null;

  const handleUseThis = () => {
    const textToSubmit = capturedText.trim() || initialPromptSuggestion;
    stopListening();
    onSubmit(textToSubmit);
    onClose();
  };

  const handleTryAgain = () => {
    setCapturedText("");
    resetTranscript();
    startListening();
  };

  const handleSimulateDemoSpeech = (phrase: string) => {
    simulateSpeech(phrase);
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
          onClick={() => {
            stopListening();
            onClose();
          }}
          className="absolute top-5 right-5 p-2 rounded-xl text-[#64748B] hover:text-[#111827] hover:bg-[#F7F8FC] transition-colors cursor-pointer"
          aria-label="Close voice input"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Listening indicator */}
        <div className="mt-2 mb-6">
          <div className="relative inline-flex items-center justify-center">
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              className={`w-24 h-24 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                isListening
                  ? "bg-gradient-to-tr from-[#635BFF] to-[#14B8A6] text-white shadow-lg shadow-[#635BFF]/30 scale-105"
                  : errorType
                  ? "bg-amber-50 border-2 border-amber-300 text-amber-600"
                  : "bg-[#F7F8FC] border-2 border-[#E5E7EB] text-[#635BFF]"
              }`}
              title={isListening ? "Click to stop listening" : "Click to start listening"}
              aria-label={isListening ? "Click to stop listening" : "Click to start listening"}
            >
              <Mic className={`w-10 h-10 ${isListening ? "animate-pulse" : ""}`} />
            </button>
            {isListening && (
              <span className="absolute -inset-2 rounded-full border-2 border-[#635BFF]/30 animate-ping pointer-events-none" />
            )}
          </div>

          <h3 className="text-2xl font-bold text-[#111827] mt-5 mb-1">
            {isListening
              ? "Listening..."
              : errorType
              ? "Voice notice"
              : capturedText
              ? "Voice captured"
              : "Microphone ready"}
          </h3>
          <p className="text-sm text-[#64748B]">
            {isListening
              ? "Tell me what you'd like to do."
              : errorType
              ? "You can try again or use text input below."
              : capturedText
              ? "Check what we heard below."
              : "Click the microphone to speak."}
          </p>

          {/* Animated Waveform */}
          {isListening && (
            <div className="flex items-center justify-center gap-1.5 h-10 mt-3" aria-hidden="true">
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

        {/* Error notification banner if applicable */}
        {errorType && errorMessage && (
          <div className="mb-5 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-start gap-2.5 text-left">
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
            <p className="leading-snug">{errorMessage}</p>
          </div>
        )}

        {/* Live / Confirmed Transcription Card */}
        <div className="bg-[#F7F8FC] rounded-2xl p-5 border border-[#E5E7EB] mb-5 min-h-[5rem] flex items-center justify-center text-center">
          <p className="text-lg font-medium text-[#111827] italic">
            "{capturedText || (isListening ? "Listening to your voice..." : "Click microphone or choose a demo suggestion...")}"
          </p>
        </div>

        {/* Quick speech simulation suggestions (ideal for noisy hackathon venues or blocked permissions) */}
        <div className="mb-6 text-left">
          <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-[#635BFF]" /> Demo speech presets:
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              "I want to book a doctor's appointment",
              "Book a train ticket",
              "Pay my electricity bill",
            ].map((phrase) => (
              <button
                key={phrase}
                type="button"
                onClick={() => handleSimulateDemoSpeech(phrase)}
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
                type="button"
                onClick={stopListening}
                className="flex-1 py-3.5 px-5 rounded-2xl border border-[#E5E7EB] text-[#111827] font-semibold hover:bg-[#F7F8FC] flex items-center justify-center gap-2 cursor-pointer"
              >
                <MicOff className="w-4 h-4 text-[#EF4444]" />
                <span>Stop</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  stopListening();
                  onClose();
                }}
                className="flex-1 py-3.5 px-5 rounded-2xl border border-[#E5E7EB] text-[#64748B] font-medium hover:bg-[#F7F8FC] cursor-pointer"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleTryAgain}
                className="py-3.5 px-5 rounded-2xl border border-[#E5E7EB] text-[#111827] font-semibold hover:bg-[#F7F8FC] flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Try again</span>
              </button>
              <button
                type="button"
                onClick={handleUseThis}
                disabled={!capturedText.trim()}
                className={`flex-1 py-3.5 px-6 rounded-2xl font-semibold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
                  capturedText.trim()
                    ? "bg-[#635BFF] hover:bg-[#5046E5] text-white hover:shadow-lg"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
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
