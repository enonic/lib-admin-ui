export function setData(el: Element, name: string, value: string) {
    el.setAttribute('data-' + name, value);
    return el;
}
