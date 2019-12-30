import {DivEl} from '../../dom/DivEl';
import {SpanEl} from '../../dom/SpanEl';
import {Element} from '../../dom/Element';
import {Mask} from './Mask';

export class LoadMask
    extends Mask {

    private splash: DivEl;

    private spinner: DivEl;

    private text: SpanEl;

    constructor(el: Element) {
        super(el);
        this.addClass('load-mask');

        this.splash = new DivEl('mask-splash');
        this.spinner = new DivEl('spinner');
        this.splash.appendChild(this.spinner);

        this.appendChild(this.splash);
    }

    show() {
        super.show();
        this.splash.show();
        this.centerSplash();
    }

    hide() {
        this.splash.hide();
        super.hide();
    }

    setText(text: string) {
        if (!text) {
            if (this.text) {
                this.text.hide();
            }
        } else {
            if (!this.text) {
                this.text = new SpanEl('text');
                this.splash.appendChild(this.text);
            }
            this.text.getEl().setInnerHtml(text);
        }
    }

    getText(): string {
        return this.text.getEl().getInnerHtml();
    }

    private centerSplash() {
        let loaderEl = this.splash.getEl();
        loaderEl.setMarginLeft('-' + loaderEl.getWidthWithBorder() / 2 + 'px');
        loaderEl.setMarginTop('-' + loaderEl.getHeightWithBorder() / 2 + 'px');
    }
}
