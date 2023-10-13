import {findElements} from './findElements';
import {isHTMLElement} from './isHTMLElement';

export function findHTMLElements(
    selector: string,
    context: Document | Element = document
): HTMLElement[] {
    return findElements(selector, context).filter((el) => isHTMLElement(el)) as HTMLElement[];
}
