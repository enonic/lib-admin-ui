import {Element, NewElementBuilder} from './Element';

export class FormEl
    extends Element {

    constructor(className?: string) {
        super(new NewElementBuilder().setTagName('form').setClassName(className));
    }

    static getNextFocusable(input: Element, focusableSelector?: string, ignoreTabIndex?: boolean): Element {
        const focusableElements: NodeList = document.querySelectorAll(focusableSelector ? focusableSelector : 'input, button, select');

        // find index of current input
        const index = FormEl.getIndexOfInput(focusableElements, input);

        if (index < 0) {
            return null;
        }

        // set focus to the next visible input
        for (let i = index + 1; i < focusableElements.length; i++) {
            let nextFocusable = Element.fromHtmlElement(<HTMLElement>focusableElements[i]);
            if (nextFocusable.isVisible() &&
                !(!ignoreTabIndex && nextFocusable.getEl().getTabIndex() && nextFocusable.getEl().getTabIndex() < 0)) {
                return nextFocusable;
            }
        }

        return null;
    }

    static moveFocusToNextFocusable(input: Element, focusableSelector?: string) {

        let nextFocusable = FormEl.getNextFocusable(input, focusableSelector);

        if (nextFocusable) {
            nextFocusable.giveFocus();
        }
    }

    static getPrevFocusable(input: Element, focusableSelector?: string): Element {
        const focusableElements: NodeList = document.querySelectorAll(focusableSelector ? focusableSelector : 'input, button, select');

        // find index of current input
        let index = FormEl.getIndexOfInput(focusableElements, input);

        let nextFocusable: Element;

        do {
            index = index - 1;
            if (0 <= index) {
                nextFocusable = Element.fromHtmlElement(<HTMLElement>focusableElements[index]);
            }
        } while (nextFocusable.getEl().getTabIndex() && nextFocusable.getEl().getTabIndex() < 0);

        return nextFocusable;
    }

    static moveFocusToPrevFocusable(input: Element, focusableSelector?: string) {
        const prevFocusable = FormEl.getPrevFocusable(input, focusableSelector);

        if (prevFocusable) {
            prevFocusable.giveFocus();
        }
    }

    private static getIndexOfInput(elements: NodeList, el: Element) {
        let index = -1;
        let inputHTMLElement = el.getHTMLElement();
        for (let i = 0; i < elements.length; i++) {
            if (inputHTMLElement === elements[i]) {
                index = i;
                break;
            }
        }
        return index;
    }

    preventSubmit() {
        this.onSubmit((event: Event) => {
            event.preventDefault();
        });
    }

    onSubmit(listener: (event: Event) => void) {
        this.getEl().addEventListener('submit', listener);
    }

    unSubmit(listener: (event: Event) => void) {
        this.getEl().removeEventListener('submit', listener);
    }
}
