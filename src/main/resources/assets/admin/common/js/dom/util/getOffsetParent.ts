import {isHTMLElement} from './isHTMLElement';

export function getOffsetParent(el: HTMLElement): HTMLElement {
    const maybeHTMLElement = el.offsetParent;
    return isHTMLElement(maybeHTMLElement) ? maybeHTMLElement : el;
}
