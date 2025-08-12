import $ from 'jquery';
import {BrowserHelper} from '../../BrowserHelper';
import {ButtonEl} from '../../dom/ButtonEl';
import {SpanEl} from '../../dom/SpanEl';

export class Button
    extends ButtonEl {

    private labelEl?: SpanEl;

    constructor(label?: string) {
        super('button');

        this.setLabel(label);
    }

    private createLabelEl(): void {
        this.labelEl = new SpanEl();
        this.prependChild(this.labelEl);
    }

    setLabel(label: string, escapeHtml: boolean = true): Button {
        if (!this.labelEl && label) {
            this.createLabelEl();
        }

        this.labelEl?.setHtml(label, escapeHtml);

        return this;
    }

    getLabel(): string {
        return this.labelEl?.getEl().getInnerHtml() || '';
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
