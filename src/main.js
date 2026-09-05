/**
 * src/main.js
 * ADAPT Member 2 Coordinator
 */

import {
    getTaskInput,
    setTaskInput,
    validateTaskInput,
    subscribeTaskInput
} from "./utils/taskInput.js";

import { VoiceInputService } from "./utils/speechRecognition.js";

import {
    speak,
    stopSpeaking
} from "./utils/speechSynthesis.js";

import {
    renderABCKeyboard
} from "./components/abcKeyboard.js";


// ===============================
// DOM ELEMENTS
// ===============================

const textarea = document.getElementById("task-input");
const btnSpeak = document.getElementById("btn-speak");
const btnToggleKeyboard = document.getElementById("btn-toggle-keyboard");
const btnReadAloud = document.getElementById("btn-read-aloud");
const btnStart = document.getElementById("btn-start");

const keyboardContainer =
    document.getElementById("keyboard-container");

const statusBadge =
    document.getElementById("status-badge");

const statusText =
    document.getElementById("status-text");

const statusIcon =
    document.getElementById("status-icon");

const audioWave =
    document.getElementById("audio-wave");

const errorMessage =
    document.getElementById("error-message");

const payloadOutput =
    document.getElementById("payload-output");

const srAnnouncer =
    document.getElementById("sr-announcer");


// ===============================
// ACCESSIBILITY ANNOUNCER
// ===============================

function announce(message) {
    if (srAnnouncer) {
        srAnnouncer.textContent = message;
    }
}


// ===============================
// PAYLOAD PREVIEW
// ===============================

function updatePayloadPreview(contract) {
    if (payloadOutput) {
        payloadOutput.textContent =
            JSON.stringify(contract, null, 2);
    }
}


// ===============================
// 1. NORMAL KEYBOARD INPUT
// ===============================

textarea.addEventListener("input", (event) => {

    setTaskInput(
        event.target.value,
        "keyboard"
    );

    errorMessage.classList.add("hidden");
});


// ===============================
// 2. VOICE INPUT
// ===============================

const voiceService = new VoiceInputService({

    lang: "en-IN",

    onStart: () => {

        btnSpeak.classList.add("active");

        btnSpeak.querySelector(".btn-label")
            .textContent = "Listening...";

        statusBadge.className =
            "status-badge listening";

        statusIcon.textContent = "🔴";

        statusText.textContent =
            "Listening... (Speak now)";

        audioWave.classList.remove("hidden");

        announce(
            "Microphone started. Listening for speech."
        );
    },

    onResult: ({ final, interim }) => {

        // Show the live transcription
        // while the user is speaking.
        const speechText =
            final || interim;

        if (speechText) {
            textarea.value = speechText;
        }

        // Only save FINAL speech
        // to the contract.
        if (final) {
            setTaskInput(
                final,
                "voice"
            );
        }
    },

    onError: ({ message }) => {

        errorMessage.textContent =
            message;

        errorMessage.classList.remove(
            "hidden"
        );

        announce(
            `Voice error: ${message}`
        );
    },

    onEnd: () => {

        btnSpeak.classList.remove("active");

        btnSpeak.querySelector(".btn-label")
            .textContent = "Speak";

        statusBadge.className =
            "status-badge idle";

        statusIcon.textContent = "⚪";

        statusText.textContent =
            `Mode: ${getTaskInput().input_mode}`;

        audioWave.classList.add("hidden");

        announce(
            "Voice listening stopped."
        );
    }
});


btnSpeak.addEventListener("click", () => {

    errorMessage.classList.add("hidden");

    voiceService.start();
});


// ===============================
// 3. ABC KEYBOARD
// ===============================

renderABCKeyboard(
    keyboardContainer,
    {

        onKeyPress: (character) => {

            textarea.value += character;

            setTaskInput(
                textarea.value,
                "keyboard"
            );

            textarea.focus();
        },

        onSpace: () => {

            textarea.value += " ";

            setTaskInput(
                textarea.value,
                "keyboard"
            );

            textarea.focus();
        },

        onBackspace: () => {

            textarea.value =
                textarea.value.slice(0, -1);

            setTaskInput(
                textarea.value,
                "keyboard"
            );

            textarea.focus();
        },

        onClear: () => {

            textarea.value = "";

            setTaskInput(
                "",
                "keyboard"
            );

            textarea.focus();
        }
    }
);


// ===============================
// ABC KEYBOARD TOGGLE
// ===============================

btnToggleKeyboard.addEventListener(
    "click",
    () => {

        const isHidden =
            keyboardContainer.classList.contains(
                "hidden"
            );

        if (isHidden) {

            keyboardContainer.classList.remove(
                "hidden"
            );

            btnToggleKeyboard.setAttribute(
                "aria-expanded",
                "true"
            );

            announce(
                "On-screen ABC keyboard opened."
            );

        } else {

            keyboardContainer.classList.add(
                "hidden"
            );

            btnToggleKeyboard.setAttribute(
                "aria-expanded",
                "false"
            );

            announce(
                "On-screen ABC keyboard closed."
            );
        }
    }
);


// ===============================
// 4. VOICE OUTPUT / TEXT TO SPEECH
// ===============================

let isSpeaking = false;


btnReadAloud.addEventListener(
    "click",
    () => {

        // If already speaking,
        // stop the speech.
        if (isSpeaking) {

            stopSpeaking();

            isSpeaking = false;

            btnReadAloud.querySelector(
                ".btn-label"
            ).textContent = "Read Aloud";

            statusBadge.className =
                "status-badge idle";

            statusIcon.textContent = "⚪";

            statusText.textContent =
                `Mode: ${getTaskInput().input_mode}`;

            return;
        }


        const currentTask =
            textarea.value.trim();


        const textToRead =
            currentTask ||
            "What do you want to do? Please enter your task using voice, keyboard, or the ABC keyboard.";


        speak(
            textToRead,
            {

                lang: "en-IN",

                rate: 0.95,

                onStart: () => {

                    isSpeaking = true;

                    btnReadAloud.querySelector(
                        ".btn-label"
                    ).textContent =
                        "Stop Reading";

                    statusBadge.className =
                        "status-badge speaking";

                    statusIcon.textContent =
                        "🔊";

                    statusText.textContent =
                        "Reading aloud...";

                    announce(
                        "Reading aloud."
                    );
                },

                onEnd: () => {

                    isSpeaking = false;

                    btnReadAloud.querySelector(
                        ".btn-label"
                    ).textContent =
                        "Read Aloud";

                    statusBadge.className =
                        "status-badge idle";

                    statusIcon.textContent =
                        "⚪";

                    statusText.textContent =
                        `Mode: ${getTaskInput().input_mode}`;
                },

                onError: () => {

                    isSpeaking = false;

                    btnReadAloud.querySelector(
                        ".btn-label"
                    ).textContent =
                        "Read Aloud";
                }
            }
        );
    }
);


// ===============================
// 5. START BUTTON
// ===============================

btnStart.addEventListener(
    "click",
    () => {

        const validation =
            validateTaskInput();


        // Empty input
        if (!validation.valid) {

            errorMessage.textContent =
                validation.error;

            errorMessage.classList.remove(
                "hidden"
            );

            announce(
                `Error: ${validation.error}`
            );

            textarea.focus();

            return;
        }


        errorMessage.classList.add(
            "hidden"
        );


        // EXACT DATA CONTRACT
        const taskData =
            getTaskInput();


        // Console output
        console.log(
            "[ADAPT Member 2 Task Input Submitted]:",
            taskData
        );


        // Show payload on screen
        updatePayloadPreview(
            taskData
        );


        announce(
            `Task ready: "${taskData.input}" using ${taskData.input_mode} mode.`
        );
    }
);


// ===============================
// LIVE CONTRACT UPDATES
// ===============================

subscribeTaskInput(
    updatePayloadPreview
);


// ===============================
// INITIAL PAYLOAD
// ===============================

updatePayloadPreview(
    getTaskInput()
);