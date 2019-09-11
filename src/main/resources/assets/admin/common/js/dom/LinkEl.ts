import {Element, NewElementBuilder} from './Element';

export class LinkEl
    extends Element {

    constructor(href: string, rel: string = 'import', className?: string) {
        super(new NewElementBuilder().setTagName('link').setClassName(className));

        this.setHref(href).setRel(rel);
    }

    setAsync(): LinkEl {
        this.getEl().setAttribute('async', '');
        return this;
    }

    onLoaded(listener: (event: UIEvent) => void) {
        this.getEl().addEventListener('load', listener);
    }

    unLoaded(listener: (event: UIEvent) => void) {
        this.getEl().removeEventListener('load', listener);
    }

    private setHref(href: string): LinkEl {
        this.getEl().setAttribute('href', href);
        return this;
    }

    private setRel(rel: string): LinkEl {
        this.getEl().setAttribute('rel', rel);
        return this;
    }
}
