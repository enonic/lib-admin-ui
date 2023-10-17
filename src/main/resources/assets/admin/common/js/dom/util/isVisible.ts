export function isVisible(el: HTMLElement) {
    return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
}
