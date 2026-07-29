"use strict";

function renderDetails(details) {
    if (!details) {
        return '<p class="empty-msg">Загрузка деталей...</p>';
    }
    const { general, networks, media, usb, sharedFolders } = details;

    const formatFlag = (value) => {
        if (value === true) return "да";
        if (value === false) return "нет";
        return "—";
    };

    const networkHtml = networks.length
        ? `<table class="detail-table">
            <thead>
                <tr>
                    <th>Adapter</th>
                    <th>Тип</th>
                    <th>MAC</th>
                    <th>Включена</th>
                    <th>Проброс портов</th>
                </tr>
            </thead>
            <tbody>
                ${networks.map(n => {
                    const pf = n.portForwarding.length
                        ? n.portForwarding.map(p => escapeHtml(p)).join("<br>")
                        : '<span class="empty-msg">—</span>';
                    return `<tr>
                        <td>${n.slot}</td>
                        <td>${n.type}</td>
                        <td>${n.mac}</td>
                        <td>${n.enabled ? "да" : "нет"}</td>
                        <td>${pf}</td>
                    </tr>`;
                }).join("")}
            </tbody>
           </table>`
        : '<p class="empty-msg">Нет настроенных сетей</p>';

    const mediaHtml = media.length
        ? `<table class="detail-table">
            <thead><tr><th>Тип</th><th>Путь</th><th>Размер</th></tr></thead>
            <tbody>${media.map(m => `<tr>
                <td>${m.type}</td>
                <td>${escapeHtml(m.path)}</td>
                <td>${escapeHtml(m.size)}</td>
            </tr>`).join("")}</tbody>
           </table>`
        : '<p class="empty-msg">Нет носителей</p>';

    const usbHtml = usb.length
        ? `<table class="detail-table">
            <thead><tr><th>USB устройство</th></tr></thead>
            <tbody>${usb.map(u => `<tr><td>${escapeHtml(u)}</td></tr>`).join("")}</tbody>
           </table>`
        : '<p class="empty-msg">Нет USB устройств</p>';

    const sfHtml = sharedFolders.length
        ? `<table class="detail-table">
            <thead>
                <tr>
                    <th>Название</th>
                    <th>Путь на хосте</th>
                    <th>Путь в гостевой ОС</th>
                    <th>Только чтение</th>
                    <th>Автоподключение</th>
                </tr>
            </thead>
            <tbody>${sharedFolders.map(sf => `<tr>
                <td>${escapeHtml(sf.name)}</td>
                <td>${escapeHtml(sf.hostPath)}</td>
                <td>${escapeHtml(sf.guestPath)}</td>
                <td>${formatFlag(sf.readOnly)}</td>
                <td>${formatFlag(sf.autoMount)}</td>
            </tr>`).join("")}</tbody>
           </table>`
        : '<p class="empty-msg">Нет общих папок</p>';

    return `
        <div class="detail-section">
            <h3>Общая</h3>
            <div class="detail-grid">
                <div><span>CPU:</span> ${general.cpu}</div>
                <div><span>Memory:</span> ${general.memory}</div>
                <div><span>ОС:</span> ${escapeHtml(general.os)}</div>
                <div><span>VRDE port:</span> ${escapeHtml(general.vrdePort)}</div>
            </div>
        </div>
        <div class="detail-section">
            <h3>Сети</h3>
            ${networkHtml}
        </div>
        <div class="detail-section">
            <h3>Носители</h3>
            ${mediaHtml}
        </div>
        <div class="detail-section">
            <h3>USB устройства</h3>
            ${usbHtml}
        </div>
        <div class="detail-section">
            <h3>Общие папки</h3>
            ${sfHtml}
        </div>
    `;
}
