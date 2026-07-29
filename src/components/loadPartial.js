export async function loadPartial(path, targetSelector) {
    const target = document.querySelector(targetSelector);
    if (!target) {
        throw new Error(`Partial target not found: ${targetSelector}`);
    }
    const response = await fetch(path);
    if (!response.ok) {
        throw new Error(`Failed to load partial ${path}: ${response.status} ${response.statusText}`);
    }
    const html = await response.text();
    target.innerHTML = html;
}
