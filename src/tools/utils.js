/**
 * Escapes special HTML characters in a string.
 *
 * @param {string} str — raw text.
 * @returns {string} HTML-escaped text safe for insertion into markup.
 */
export function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Formats a boolean value as a Russian yes/no label.
 *
 * @param {boolean|null|undefined} value — boolean flag.
 * @returns {string} "да", "нет" or "—".
 */
export function formatFlag(value) {
    if (value === true) return "да";
    if (value === false) return "нет";
    return "—";
}

/**
 * Returns a CSS class for the status dot based on VM state.
 *
 * @param {string} state — VM state.
 * @returns {string} CSS class name: "dot-running", "dot-paused" or "dot-off".
 */
export function stateDotClass(state) {
    if (state === "running") return "dot-running";
    if (state === "paused") return "dot-paused";
    return "dot-off";
}

/**
 * Translates a VM state string into a human-readable Russian label.
 *
 * @param {string} state — raw VM state.
 * @returns {string} localized state label.
 */
export function stateLabel(state) {
    const map = {
        running: "Запущена",
        paused: "На паузе",
        poweroff: "Выключена",
        saved: "Сохранено состояние",
        aborted: "Аварийно завершена",
    };
    return map[state] || state;
}
