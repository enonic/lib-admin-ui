import {Element} from '../../dom/Element';
import {Action} from '../Action';
import {SplashMask} from './SplashMask';
import {assertState} from '../../util/Assert';
import {PEl} from '../../dom/PEl';
import {DivEl} from '../../dom/DivEl';
import {ActionButton} from '../button/ActionButton';

export class ConfirmationMask
    extends SplashMask {

    constructor(builder: ConfirmationMaskBuilder) {
        super(builder.getElement());

        assertState(builder.getActions()?.length > 0, 'There must be at least one action');

        const elements = [];
        if (builder.getQuestion()) {
            const questionEl = new PEl('mask-question');
            questionEl.setHtml(builder.getQuestion(), false);
            elements.push(questionEl);
        }

        const actionsEl = new DivEl('mask-actions');
        builder.getActions().forEach(action => actionsEl.appendChild(new ActionButton(action)));
        elements.push(actionsEl);

        this.setContents(...elements);
        this.setHideOnScroll(builder.getHideOnScroll());
        this.setHideOnOutsideClick(builder.getHideOnOutsideClick());
    }

    public static create(): ConfirmationMaskBuilder {
        return new ConfirmationMaskBuilder();
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
