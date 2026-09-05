import { useState, useRef, useCallback, useEffect } from "react";

interface UseVoiceRecognitionOptions {
  onResult?: (finalTranscript: string) => void;
  mockFallbackPhrase?: string;
}

export function useVoiceRecognition(options?: UseVoiceRecognitionOptions) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const simulationTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    // Check browser SpeechRecognition support
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
        if (event.results[0].isFinal) {
          options?.onResult?.(currentTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error, using fallback simulation", event.error);
        setError(event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
      if (simulationTimeoutRef.current) {
        clearTimeout(simulationTimeoutRef.current);
      }
    };
  }, [options]);

  const startListening = useCallback(() => {
    setTranscript("");
    setError(null);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        return;
      } catch (e) {
        console.warn("Could not start native recognition, using realistic fallback", e);
      }
    }

    // Fallback simulation: simulates realistic speech acquisition for testing/demo
    setIsListening(true);
    const phrases = [
      options?.mockFallbackPhrase || "I want to book a doctor's appointment",
      "I need to book a bus ticket to Central City",
      "Transfer fifty dollars to Jordan",
    ];
    const phraseToUse = phrases[0];

    // Gradually append words to simulate real-time transcription
    const words = phraseToUse.split(" ");
    let current = "";
    words.forEach((word, index) => {
      simulationTimeoutRef.current = window.setTimeout(() => {
        current += (index > 0 ? " " : "") + word;
        setTranscript(current);
        if (index === words.length - 1) {
          setIsListening(false);
          options?.onResult?.(current);
        }
      }, (index + 1) * 350);
    });
  }, [options]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    if (simulationTimeoutRef.current) {
      clearTimeout(simulationTimeoutRef.current);
    }
    setIsListening(false);
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setError(null);
  }, []);

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    resetTranscript,
    setTranscript,
  };
}
