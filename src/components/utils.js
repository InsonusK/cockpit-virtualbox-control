export function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

export function formatFlag(value) {
    if (value === true) return "да";
    if (value === false) return "нет";
    return "—";
}

export function stateDotClass(state) {
    if (state === "running") return "dot-running";
    if (state === "paused") return "dot-paused";
    return "dot-off";
}

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
