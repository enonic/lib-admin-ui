import {isHTMLElement} from './isHTMLElement';
import {first} from './first';

export function selectHTMLElement(
    selector: string,
    context: Document | Element = document
): HTMLElement | null {
    const el = first(selector, context);
    return isHTMLElement(el) ? el : null;
}
