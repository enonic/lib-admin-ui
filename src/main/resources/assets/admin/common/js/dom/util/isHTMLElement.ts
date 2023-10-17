export function isHTMLElement(el: unknown): el is HTMLElement {
    if (typeof HTMLElement !== 'object') {
        throw new Error('Your browser does not support HTMLElement. Please use a newer browser.');
    }
    return el instanceof HTMLElement;
}
