import {Element, NewElementBuilder} from './Element';

export enum LinkType {
    STYLESHEET
}

export class LinkEl extends Element {

    constructor(href: string = '#', type: LinkType = LinkType.STYLESHEET) {
        super(new NewElementBuilder().setTagName('link'));

        this.setHref(href).setType(type);
    }

    private setType(type: LinkType) {
        switch (type) {
            case LinkType.STYLESHEET:
                this.setRel('stylesheet');
                this.getEl().setAttribute('type', 'text/css');
        }
    }

    private setHref(href: string): LinkEl {
        this.getEl().setAttribute('href', href);
        return this;
    }

    setRel(rel: string): LinkEl {
        this.getEl().setAttribute('rel', rel);
        return this;
    }

    setAsync(): LinkEl {
        this.getEl().setAttribute('async', '');
        return this;
    }
}
