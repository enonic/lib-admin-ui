export function getPosition(el: Element) {
    const {top, left} = el.getBoundingClientRect();
    const {marginTop, marginLeft} = getComputedStyle(el);
    return {
        top: top - parseInt(marginTop, 10),
        left: left - parseInt(marginLeft, 10)
    };
}
