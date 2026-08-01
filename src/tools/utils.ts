/** Escapes special HTML characters in a string. */
export function escapeHtml(str: string): string {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

/** Formats a boolean value as a Russian yes/no label. */
export function formatFlag(value: boolean | null | undefined): string {
    if (value === true) return "да";
    if (value === false) return "нет";
    return "—";
}

/** Returns a CSS class for the status dot based on VM state. */
export function stateDotClass(state: string): string {
    if (state === "running") return "dot-running";
    if (state === "paused") return "dot-paused";
    return "dot-off";
}

/** Translates a VM state string into a human-readable Russian label. */
export function stateLabel(state: string): string {
    const map: Record<string, string> = {
        running: "Запущена",
        paused: "На паузе",
        poweroff: "Выключена",
        saved: "Сохранено состояние",
        aborted: "Аварийно завершена",
    };
    return map[state] || state;
}
