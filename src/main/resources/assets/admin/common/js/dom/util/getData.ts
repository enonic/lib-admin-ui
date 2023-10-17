export function getData(el: Element, name: string): string | null {
    return el.getAttribute(`data-${name}`);
}
