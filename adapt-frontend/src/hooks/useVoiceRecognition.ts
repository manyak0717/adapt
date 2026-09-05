import { useState, useRef, useCallback, useEffect } from "react";

export type VoiceErrorType =
  | "permission-denied"
  | "no-speech"
  | "unsupported"
  | "recognition-error"
  | null;

interface UseVoiceRecognitionOptions {
  onResult?: (finalTranscript: string) => void;
  mockFallbackPhrase?: string;
}

export function useVoiceRecognition(options?: UseVoiceRecognitionOptions) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [errorType, setErrorType] = useState<VoiceErrorType>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<number | null>(null);
  const isStartingRef = useRef(false);
  const simulationTimerRef = useRef<number | null>(null);

  // Check browser support on mount
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
    }

    return () => {
      // Cleanup any active recognition and timers
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
        recognitionRef.current = null;
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (simulationTimerRef.current) {
        clearTimeout(simulationTimerRef.current);
      }
    };
  }, []);

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  const stopListening = useCallback(() => {
    clearSilenceTimer();
    if (simulationTimerRef.current) {
      clearTimeout(simulationTimerRef.current);
      simulationTimerRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    isStartingRef.current = false;
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    // If already listening or starting, stop cleanly (handle toggle / duplicate clicks)
    if (isListening || isStartingRef.current) {
      stopListening();
      return;
    }

    // Reset state
    setTranscript("");
    setErrorType(null);
    setErrorMessage(null);
    clearSilenceTimer();

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      setErrorType("unsupported");
      setErrorMessage("Speech recognition is not supported in this browser. You can type your request instead.");
      setIsListening(false);
      return;
    }

    try {
      isStartingRef.current = true;
      // Always create a fresh instance per session to avoid Chromium InvalidStateError
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";
      recognition.maxAlternatives = 1;

      // Inactivity timeout: stop if no speech heard within 8 seconds
      silenceTimerRef.current = window.setTimeout(() => {
        if (isListening) {
          stopListening();
          setErrorType("no-speech");
          setErrorMessage("We didn't hear anything. Try again or type your request.");
        }
      }, 8000);

      recognition.onstart = () => {
        isStartingRef.current = false;
        setIsListening(true);
        setErrorType(null);
        setErrorMessage(null);
      };

      recognition.onresult = (event: any) => {
        clearSilenceTimer();
        let currentText = "";
        let isFinal = false;

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item && item[0]) {
            currentText += item[0].transcript;
            if (item.isFinal) {
              isFinal = true;
            }
          }
        }

        const trimmed = currentText.trim();
        if (trimmed) {
          setTranscript(trimmed);
        }

        if (isFinal && trimmed) {
          options?.onResult?.(trimmed);
          stopListening();
        }
      };

      recognition.onerror = (event: any) => {
        clearSilenceTimer();
        isStartingRef.current = false;
        setIsListening(false);
        recognitionRef.current = null;

        const error = event.error;
        if (error === "not-allowed" || error === "permission-denied") {
          setErrorType("permission-denied");
          setErrorMessage("Microphone access is unavailable. You can type your request instead.");
        } else if (error === "no-speech") {
          setErrorType("no-speech");
          setErrorMessage("We didn't hear anything. Try again or type your request.");
        } else if (error === "aborted") {
          // User intentionally stopped or closed, no error
          setErrorType(null);
          setErrorMessage(null);
        } else {
          setErrorType("recognition-error");
          setErrorMessage("Voice recognition encountered an issue. Please try again or type your request.");
        }
      };

      recognition.onend = () => {
        clearSilenceTimer();
        isStartingRef.current = false;
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      isStartingRef.current = false;
      setIsListening(false);
      recognitionRef.current = null;

      console.warn("Speech recognition initialization failed:", err);
      setErrorType("recognition-error");
      setErrorMessage("Could not activate microphone. You can type your request instead.");
    }
  }, [isListening, options, stopListening]);

  // Demo simulation method for testing without mic or in noisy hackathon halls
  const simulateSpeech = useCallback((customPhrase?: string) => {
    stopListening();
    setTranscript("");
    setErrorType(null);
    setErrorMessage(null);
    setIsListening(true);

    const phrase =
      customPhrase ||
      options?.mockFallbackPhrase ||
      "I want to book a doctor's appointment";

    const words = phrase.split(" ");
    let current = "";

    words.forEach((word, index) => {
      simulationTimerRef.current = window.setTimeout(() => {
        current += (index > 0 ? " " : "") + word;
        setTranscript(current);

        if (index === words.length - 1) {
          setIsListening(false);
          options?.onResult?.(current);
        }
      }, (index + 1) * 300);
    });
  }, [options, stopListening]);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setErrorType(null);
    setErrorMessage(null);
  }, []);

  return {
    isListening,
    transcript,
    errorType,
    errorMessage,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    simulateSpeech,
    setTranscript,
  };
}
