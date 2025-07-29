import {map, MapStore} from 'nanostores';
import type {ComponentProps, ComponentType} from 'preact';
import {h, render} from 'preact';
import * as Q from 'q';

import {Element as BaseElement, NewElementBuilder} from '../dom/Element';

export type Component<P> = ComponentType<P>;

export class LegacyElement<C extends ComponentType<object>, P extends ComponentProps<C> = ComponentProps<C>> extends BaseElement {

    protected props: MapStore<P>;

    protected component: C;

    constructor(props: P, component: C) {
        super(new NewElementBuilder().setTagName('div').setClassName('contents'));

        this.component = component;
        this.props = map({...props});
        this.props.subscribe(() => void this.render());
    }

    setProps(props: Partial<P>): void {
        this.props.set({...this.props.get(), ...props});
    }

    doRender(): Q.Promise<boolean> {
        render(h(this.component, this.props.get()), this.getHTMLElement());
        return super.doRender();
    }

    //! Overrides

    giveFocus(): boolean {
        const focusableElements = this.getHTMLElement().querySelectorAll('& > button, & > input');
        if (focusableElements.length > 0 && focusableElements[0] instanceof HTMLElement) {
            focusableElements[0].focus();
            return true;
        }
        return false;
    }
}
