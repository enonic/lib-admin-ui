import {IdProvider} from '@enonic/ui';
import {nanoid} from 'nanoid';
import {map, type MapStore} from 'nanostores';
import type {ComponentProps, ComponentType} from 'react';
import {render} from 'react-dom';
import {Element as BaseElement, NewElementBuilder} from '../dom/Element';

export class LegacyElement<C extends ComponentType<any>, P extends ComponentProps<C> = ComponentProps<C>> extends BaseElement {

    protected readonly props: MapStore<P>;

    protected readonly component: C;

    constructor(props: ComponentProps<C>, component: C) {
        super(new NewElementBuilder().setTagName('div').setClassName('contents'));
        this.component = component;
        this.props = map({...props});
        this.props.subscribe(() => {
            void this.render();
        });
    }

    setProps(props: Partial<P>): void {
        this.props.set({...this.props.get(), ...props});
    }

    protected renderJsx(): void {
        const prefix = `${this.component.displayName ?? this.constructor.name}-${nanoid(8)}`;
        const props = this.props.get();
        const Component = this.component;

        render(
            <IdProvider prefix={prefix}>
                <Component {...props} />
            </IdProvider>,
            this.getHTMLElement()
        );
    }

    //! Overrides

    override doRender(): Q.Promise<boolean> {
        this.renderJsx();
        return super.doRender();
    }

    override giveFocus(): boolean {
        const focusableElements = this.getHTMLElement().querySelectorAll('& > button, & > input');
        if (focusableElements.length > 0 && focusableElements[0] instanceof HTMLElement) {
            focusableElements[0].focus();
            return true;
        }
        return false;
    }

    override addClass(className: string): this {
        if (hasClassName(this.props)) {
            this.props.setKey('className', `${this.props.value.className} ${className}`);
        } else {
            console.warn(`[${this.component.name}]: className is not allowed as a property`);
        }
        return this;
    }

    override removeClass(className: string): this {
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
