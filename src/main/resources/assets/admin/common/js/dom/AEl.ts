import {Element, NewElementBuilder} from './Element';

export class AEl
    extends Element {

    constructor(className?: string) {
        super(new NewElementBuilder().setTagName('a').setClassName(className));

        this.setUrl('#');
    }

    setUrl(value: string, target?: string): AEl {
        this.getEl().setAttribute('href', value);
        if (target) {
            this.getEl().setAttribute('target', target);
        }
        return this;
    }

    getTitle(): string {
        return this.getEl().getTitle();
    }

    getHref(): string {
        return this.getEl().getAttribute('href');
    }

    getTarget(): string {
        return this.getEl().getAttribute('target');
    }

    getText(): string {
        return this.getEl().getText();
    }

    static fromText(text: string): AEl {
        const a = new AEl();
        a.setHtml(text);
        return a;
    }
}
