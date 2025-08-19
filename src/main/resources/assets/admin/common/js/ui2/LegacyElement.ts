import {map, type MapStore} from 'nanostores';
import * as Q from 'q';
import type {ComponentProps, ComponentType} from 'react';
import {createElement} from 'react';
import {render} from 'react-dom';

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

    protected renderJsx(): void {
        render(createElement(this.component, this.props.get()), this.getHTMLElement());
    }

    doRender(): Q.Promise<boolean> {
        this.renderJsx();
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

    addClass(className: string): this {
        if (hasClassName(this.props)) {
            this.props.setKey('className', `${this.props.value.className} ${className}`);
        } else {
            console.warn(`[${this.component.name}]: className is not allowed as a property`);
        }
        return this;
    }

    removeClass(className: string): this {
        if (hasClassName(this.props)) {
            const newClassName = this.props.value.className.split(' ').filter(c => c !== className).join(' ');
            this.props.setKey('className', newClassName);
        } else {
            console.warn(`[${this.component.name}]: className is not allowed as a property`);
        }
        return this;
    }
}

function hasClassName(props: MapStore): props is MapStore<{className: string}> {
    return 'className' in props.value && typeof props.value.className === 'string';
}
