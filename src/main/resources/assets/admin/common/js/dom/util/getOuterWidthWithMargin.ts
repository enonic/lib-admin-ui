export function getOuterWidthWithMargin(el: Element) {
    const style = getComputedStyle(el);

    return (
        el.getBoundingClientRect().width +
        parseFloat(style.marginLeft) +
        parseFloat(style.marginRight)
    );
}
