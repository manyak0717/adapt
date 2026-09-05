/**
 * abcKeyboard.js
 * Accessible On-Screen ABC Keyboard
 */

const KEYBOARD_ROWS = [

    ["A", "B", "C", "D", "E", "F", "G"],

    ["H", "I", "J", "K", "L", "M", "N"],

    ["O", "P", "Q", "R", "S", "T", "U"],

    ["V", "W", "X", "Y", "Z"]
];


export function renderABCKeyboard(
    containerElement,
    {
        onKeyPress,
        onSpace,
        onBackspace,
        onClear
    }
) {

    // Clear existing keyboard
    containerElement.innerHTML = "";

    const wrapper =
        document.createElement("div");

    wrapper.className =
        "abc-keyboard-inner";

    wrapper.setAttribute(
        "role",
        "group"
    );

    wrapper.setAttribute(
        "aria-label",
        "On-screen ABC Keyboard"
    );


    // Create letter rows
    KEYBOARD_ROWS.forEach(row => {

        const rowElement =
            document.createElement("div");

        rowElement.className =
            "keyboard-row";


        row.forEach(letter => {

            const button =
                document.createElement("button");

            button.type = "button";

            button.className =
                "key-btn letter-key";

            button.textContent = letter;

            button.setAttribute(
                "aria-label",
                `Letter ${letter}`
            );


            button.addEventListener(
                "click",
                () => onKeyPress(letter)
            );


            rowElement.appendChild(button);

        });


        wrapper.appendChild(rowElement);

    });


    // Action buttons
    const actionRow =
        document.createElement("div");

    actionRow.className =
        "keyboard-row action-row";


    // SPACE
    const spaceButton =
        document.createElement("button");

    spaceButton.type = "button";

    spaceButton.className =
        "key-btn action-key space-key";

    spaceButton.textContent =
        "SPACE";

    spaceButton.setAttribute(
        "aria-label",
        "Space"
    );

    spaceButton.addEventListener(
        "click",
        onSpace
    );


    // BACKSPACE
    const backspaceButton =
        document.createElement("button");

    backspaceButton.type = "button";

    backspaceButton.className =
        "key-btn action-key backspace-key";

    backspaceButton.textContent =
        "BACKSPACE";

    backspaceButton.setAttribute(
        "aria-label",
        "Backspace"
    );

    backspaceButton.addEventListener(
        "click",
        onBackspace
    );


    // CLEAR
    const clearButton =
        document.createElement("button");

    clearButton.type = "button";

    clearButton.className =
        "key-btn action-key clear-key";

    clearButton.textContent =
        "CLEAR";

    clearButton.setAttribute(
        "aria-label",
        "Clear all text"
    );

    clearButton.addEventListener(
        "click",
        onClear
    );


    actionRow.appendChild(spaceButton);

    actionRow.appendChild(backspaceButton);

    actionRow.appendChild(clearButton);

    wrapper.appendChild(actionRow);

    containerElement.appendChild(wrapper);
}