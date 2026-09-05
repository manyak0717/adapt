/**
 * speechRecognition.js
 * Member 2 - Voice Input
 */

import { setTaskInput } from "./taskInput.js";

export class VoiceInputService {

    constructor({
        lang = "en-IN",
        onStart = () => {},
        onResult = () => {},
        onError = () => {},
        onEnd = () => {}
    } = {}) {

        this.lang = lang;
        this.onStart = onStart;
        this.onResult = onResult;
        this.onError = onError;
        this.onEnd = onEnd;

        this.isListening = false;
        this.recognition = null;

        // Check whether browser supports Speech Recognition
        const SpeechRecognition =
            window.SpeechRecognition ||
            window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            this.isSupported = false;
            return;
        }

        this.isSupported = true;

        // Create speech recognition object
        this.recognition = new SpeechRecognition();

        // Settings
        this.recognition.lang = this.lang;
        this.recognition.continuous = false;
        this.recognition.interimResults = true;

        // When microphone starts
        this.recognition.onstart = () => {

            this.isListening = true;

            this.onStart();
        };

        // When speech is detected
        this.recognition.onresult = (event) => {

            let finalTranscript = "";
            let interimTranscript = "";

            for (
                let i = event.resultIndex;
                i < event.results.length;
                i++
            ) {

                const result = event.results[i];

                if (result.isFinal) {

                    finalTranscript += result[0].transcript;

                } else {

                    interimTranscript += result[0].transcript;
                }
            }

            // Send result to UI
            this.onResult({
                final: finalTranscript.trim(),
                interim: interimTranscript.trim()
            });

            // If speech is final, save it in taskInput
            if (finalTranscript.trim()) {

                setTaskInput(
                    finalTranscript.trim(),
                    "voice"
                );
            }
        };

        // Handle errors
        this.recognition.onerror = (event) => {

            let message = "Voice recognition error.";

            if (event.error === "not-allowed") {

                message =
                    "Microphone permission was denied. Please allow microphone access.";

            } else if (event.error === "no-speech") {

                message =
                    "No speech was detected. Please try again.";

            } else if (event.error === "network") {

                message =
                    "Network connection problem. Please check your internet connection.";

            } else if (event.error === "audio-capture") {

                message =
                    "Microphone could not be detected. Please check your microphone.";

            }

            this.onError({
                error: event.error,
                message: message
            });
        };

        // When recognition stops
        this.recognition.onend = () => {

            this.isListening = false;

            this.onEnd();
        };
    }


    start() {

        // Browser doesn't support voice input
        if (!this.isSupported) {

            this.onError({
                error: "unsupported",
                message:
                    "Voice input is not supported in this browser. Please use Google Chrome or Microsoft Edge."
            });

            return false;
        }

        // Already listening → stop
        if (this.isListening) {

            this.recognition.stop();

            return true;
        }

        try {

            this.recognition.start();

            return true;

        } catch (error) {

            this.onError({
                error: "start-error",
                message: error.message
            });

            return false;
        }
    }


    stop() {

        if (this.recognition && this.isListening) {

            this.recognition.stop();
        }
    }
}


/**
 * Creates a voice input service
 * connected to the ADAPT task input contract.
 */
export function createVoiceInputWithContract(options = {}) {

    return new VoiceInputService(options);
}