import {ButtonEl} from '../../dom/ButtonEl';
import {SpanEl} from '../../dom/SpanEl';
import {BrowserHelper} from '../../BrowserHelper';

export class Button
    extends ButtonEl {

    private labelEl: SpanEl;

    constructor(label?: string) {
        super('button');

        this.labelEl = new SpanEl();
        if (label) {
            this.labelEl.getEl().setInnerHtml(label, false);
        }
        this.appendChild(this.labelEl);
    }

    setEnabled(value: boolean): Button {
        this.getEl().setDisabled(!value);
        return this;
    }

    isEnabled() {
        return !this.getEl().isDisabled();
    }

    setLabel(label: string, escapeHtml: boolean = true): Button {
        this.labelEl.getEl().setInnerHtml(label, escapeHtml);
        return this;
    }

    getLabel(): string {
        return this.labelEl.getEl().getInnerHtml();
    }

    setTitle(title: string, forceAction: boolean = true): Button {
        if (!BrowserHelper.isIOS()) {
            if (title) {
                this.getEl().setAttribute('title', title);
                if (forceAction) {
                    $(this.getEl().getHTMLElement()).trigger('mouseenter');
                }
            } else {
                if (forceAction) {
                    $(this.getEl().getHTMLElement()).trigger('mouseleave');
                }
                this.getEl().removeAttribute('title');
            }
        }
        return this;
    }
}
