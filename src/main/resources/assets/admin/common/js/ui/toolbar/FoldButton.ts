import {i18n} from '../../util/Messages';
import {DivEl} from '../../dom/DivEl';
import {SpanEl} from '../../dom/SpanEl';
import {Element} from '../../dom/Element';
import {StyleHelper} from '../../StyleHelper';
import {Body} from '../../dom/Body';

export class FoldButton
    extends DivEl {

    private static expandedCls: string = 'expanded';
    private span: SpanEl;
    private dropdown: DivEl;
    private widthCache: number[] = [];
    private hostElement: Element;

    constructor(caption: string = i18n('action.actions'), hostElement?: Element) {
        super();

        this.addClass('fold-button');

        this.dropdown = new DivEl('dropdown', StyleHelper.COMMON_PREFIX);
        this.appendChild(this.dropdown);

        this.span = new SpanEl('fold-label');
        this.span.setHtml(caption);
        this.appendChild(this.span);

        if (hostElement) {
            this.hostElement = hostElement;
        }

        (hostElement || this).onClicked(this.onButtonClicked.bind(this));
        this.dropdown.onClicked(this.onMenuClicked.bind(this));
    }

    public collapse() {
        this.removeClass(FoldButton.expandedCls);
        if (this.hostElement) {
            this.hostElement.removeClass(FoldButton.expandedCls);
        }
    }

    push(element: Element, width: number) {
        this.dropdown.prependChild(element);
        this.widthCache.unshift(width);
    }

    pop(): Element {
        let top = this.dropdown.getFirstChild();
        this.dropdown.removeChild(top);
        this.widthCache.shift();
        return top;
    }

    setLabel(label: string) {
        this.span.setHtml(label);
    }

    getDropdown(): DivEl {
        return this.dropdown;
    }

    getNextButtonWidth(): number {
        return this.widthCache[0];
    }

    getButtonsCount(): number {
        return this.dropdown.getChildren().length;
    }

    isEmpty(): boolean {
        return this.dropdown.getChildren().length === 0;
    }

    private toggle() {
        this.toggleClass(FoldButton.expandedCls);
        if (this.hostElement) {
            this.hostElement.toggleClass(FoldButton.expandedCls);
        }
    }

    private onButtonClicked(e: MouseEvent) {
        let onBodyClicked = () => {
            this.collapse();
            Body.get().unClicked(onBodyClicked);
        };

        this.toggle();
        if (this.hasClass(FoldButton.expandedCls)) {
            Body.get().onClicked(onBodyClicked);
        }

        e.stopPropagation();
    }

    private onMenuClicked(e: MouseEvent) {
        this.collapse();
        e.stopPropagation();
    }

}
