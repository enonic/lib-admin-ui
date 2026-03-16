import {Body} from '../../dom/Body';
import {DivEl} from '../../dom/DivEl';
import {Element} from '../../dom/Element';
import {PEl} from '../../dom/PEl';
import {ActionButton} from '../../ui2/ActionButton';
import {assertState} from '../../util/Assert';
import {Action} from '../Action';
import {SplashMask} from './SplashMask';

export class ConfirmationMask
    extends SplashMask {

    private readonly actionsEl: DivEl;

    private tabListener: (event: KeyboardEvent) => boolean;

    constructor(builder: ConfirmationMaskBuilder) {
        super(builder.getElement());
        this.addClass('confirmation-mask');

        assertState(builder.getActions()?.length > 0, 'There must be at least one action');

        const elements = [];
        if (builder.getQuestion()) {
            const questionEl = new PEl('mask-question');
            questionEl.setHtml(builder.getQuestion(), false);
            elements.push(questionEl);
        }

        this.actionsEl = new DivEl('mask-actions');
        builder.getActions().forEach(action => this.actionsEl.appendChild(new ActionButton({action})));
        elements.push(this.actionsEl);

        this.setContents(...elements);
        this.setHideOnScroll(builder.getHideOnScroll());
        this.setHideOnOutsideClick(builder.getHideOnOutsideClick());
    }

    protected initListeners() {
        super.initListeners();

        this.tabListener = (event: KeyboardEvent) => {
            const firstChild = this.actionsEl.getFirstChild();
            const lastChild = this.actionsEl.getLastChild();
            if (event.key === 'Tab') {
                // loop focus
                if (lastChild?.hasFocus() && !event.shiftKey) {
                    firstChild.giveFocus();
                    event.preventDefault();
                    return true;
                } else if (firstChild?.hasFocus() && event.shiftKey) {
                    lastChild.giveFocus();
                    event.preventDefault();
                    return true;
                }
            }
            return false;
        };
    }

    public static create(): ConfirmationMaskBuilder {
        return new ConfirmationMaskBuilder();
    }

    show() {
        super.show();
        this.giveFocus();
        Body.get().onKeyDown(this.tabListener);
    }

    hide() {
        super.hide();
        Body.get().unKeyDown(this.tabListener);
    }

    giveFocus(): boolean {
        return this.actionsEl.getFirstChild()?.giveFocus();
    }
}

export class ConfirmationMaskBuilder {
    private el: Element;
    private question: string;
    private actions: Action[] = [];
    private hideOnScroll: boolean;
    private hideOnOutsideClick: boolean;

    setElement(el: Element): ConfirmationMaskBuilder {
        this.el = el;
        return this;
    }

    setQuestion(question: string): ConfirmationMaskBuilder {
        this.question = question;
        return this;
    }

    addAction(action: Action): ConfirmationMaskBuilder {
        this.actions.push(action);
        return this;
    }

    setHideOnScroll(flag: boolean): ConfirmationMaskBuilder {
        this.hideOnScroll = flag;
        return this;
    }

    setHideOnOutsideClick(flag: boolean): ConfirmationMaskBuilder {
        this.hideOnOutsideClick = flag;
        return this;
    }

    getElement(): Element {
        return this.el;
    }

    getQuestion(): string {
        return this.question;
    }

    getActions(): Action[] {
        return this.actions;
    }

    getHideOnScroll(): boolean {
        return this.hideOnScroll;
    }

    getHideOnOutsideClick(): boolean {
        return this.hideOnOutsideClick;
    }

    build(): ConfirmationMask {
        return new ConfirmationMask(this);
    }
}
