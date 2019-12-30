import {Element} from '../../dom/Element';

export class DropdownExpandedEvent {

    private expanded: boolean;
    private dropDownElement: Element;

    constructor(dropDownElement: Element, expanded: boolean) {
        this.dropDownElement = dropDownElement;
        this.expanded = expanded;
    }

    isExpanded(): boolean {
        return this.expanded;
    }

    getDropdownElement(): Element {
        return this.dropDownElement;
    }
}
