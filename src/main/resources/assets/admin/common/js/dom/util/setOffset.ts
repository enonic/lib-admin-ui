export function setOffset(el: HTMLElement, {top, left}: {top: number, left: number}) {
    el.style.top = `${top}px`;
    el.style.left = `${left}px`;
    return el;
}
