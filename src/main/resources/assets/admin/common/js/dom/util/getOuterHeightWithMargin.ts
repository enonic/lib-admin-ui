export function getOuterHeightWithMargin(el: Element) {
    const style = getComputedStyle(el);

    return (
        el.getBoundingClientRect().height +
        parseFloat(style.marginTop) +
        parseFloat(style.marginBottom)
    );
}
