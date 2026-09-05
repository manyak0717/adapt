/**
 * src/utils/taskInput.js
 * Member 2 Data Contract Store
 */

export const INPUT_MODES = Object.freeze({
    VOICE: "voice",
    KEYBOARD: "keyboard",
    TEXT: "text"
});

const state = {
    input: "",
    input_mode: INPUT_MODES.KEYBOARD
};

const listeners = new Set();

/**
 * Returns the input in the format required by ADAPT.
 */
export function getTaskInput() {
    return {
        input: state.input.trim(),
        input_mode: state.input_mode
    };
}

/**
 * Updates the user's input.
 */
export function setTaskInput(text, mode = null) {

    state.input = text ?? "";

    if (
        mode &&
        Object.values(INPUT_MODES).includes(mode)
    ) {
        state.input_mode = mode;
    }

    notify();
}

/**
 * Changes the current input mode.
 */
export function setInputMode(mode) {

    if (Object.values(INPUT_MODES).includes(mode)) {
        state.input_mode = mode;
        notify();
    }
}

/**
 * Checks whether the user has entered a task.
 */
export function validateTaskInput() {

    const current = getTaskInput();

    if (!current.input) {

        return {
            valid: false,
            error: "Please enter or speak a task before starting."
        };
    }

    return {
        valid: true,
        payload: current
    };
}

/**
 * Allows other components to listen for input changes.
 */
export function subscribeTaskInput(callback) {

    listeners.add(callback);

    return () => listeners.delete(callback);
}

function notify() {

    const snapshot = getTaskInput();

    listeners.forEach(function(callback) {
        callback(snapshot);
    });
}