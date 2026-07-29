/** Cache for already fetched and resolved partial templates. */
const partialCache = new Map();

/**
 * Loads an HTML partial and inserts it into the selected DOM element.
 *
 * @param {string} path — URL of the partial template.
 * @param {string} targetSelector — CSS selector of the element to populate.
 * @returns {Promise<void>}
 * @throws {Error} if the target element is not found or the partial fails to load.
 */
export async function loadPartial(path, targetSelector) {
    const target = document.querySelector(targetSelector);
    if (!target) {
        throw new Error(`Partial target not found: ${targetSelector}`);
    }
    const html = await fetchPartial(path);
    target.innerHTML = html;
}

/**
 * Fetches a partial template and recursively resolves `<x-include>` tags.
 *
 * Results are cached so nested includes are fetched only once.
 *
 * @param {string} path — URL of the partial template.
 * @returns {Promise<string>} resolved HTML with all includes inlined.
 * @throws {Error} if the HTTP request fails.
 */
async function fetchPartial(path) {
    if (partialCache.has(path)) {
        return partialCache.get(path);
    }
    const response = await fetch(path);
    if (!response.ok) {
        throw new Error(`Failed to load partial ${path}: ${response.status} ${response.statusText}`);
    }
    let html = await response.text();

    const includeRe = /<x-include\s+src="([^"]+)"\s*><\/x-include>/g;
    const replacements = [];
    let match;
    while ((match = includeRe.exec(html)) !== null) {
        const incPath = match[1];
        const incHtml = await fetchPartial(incPath);
        replacements.push({ from: match[0], to: incHtml });
    }
    for (const { from, to } of replacements) {
        html = html.split(from).join(to);
    }

    partialCache.set(path, html);
    return html;
}
