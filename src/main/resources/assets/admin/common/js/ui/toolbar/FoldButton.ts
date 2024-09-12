import {Body} from '../../dom/Body';
import {DivEl} from '../../dom/DivEl';
import {Element} from '../../dom/Element';
import {SpanEl} from '../../dom/SpanEl';
import {StyleHelper} from '../../StyleHelper';
import {i18n} from '../../util/Messages';
import {AriaHasPopup, AriaRole, WCAG} from '../WCAG';

export class FoldButton
    extends DivEl
    implements WCAG {

    [WCAG]: boolean = true;
    ariaLabel: string = i18n('wcag.toolbar.foldButton');
    role: AriaRole = AriaRole.BUTTON;
    ariaHasPopup: AriaHasPopup.MENU;
    tabbable: boolean = true;

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

        this.initListeners();
    }

    private initListeners() {
        (this.hostElement || this).onClicked(this.toggleMenu.bind(this));
        this.dropdown.onClicked(this.onMenuClicked.bind(this));
        this.onApplyKeyPressed(this.toggleMenu.bind(this));
        this.onEscPressed(this.collapse.bind(this));
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

    private toggleMenu(event?: MouseEvent) {
        this.toggle();

        if (this.hasClass(FoldButton.expandedCls)) {
            const onBodyClicked = (ev: PointerEvent) => {
                if (ev.target === (this.hostElement || this).getHTMLElement()) {
                    return;
                }
                this.collapse();
                Body.get().unClicked(onBodyClicked);
            };

            Body.get().onClicked(onBodyClicked);
        }

        event?.stopPropagation();
    }

    private onMenuClicked(event: MouseEvent) {
        this.collapse();

        event.stopPropagation();
    }

}
