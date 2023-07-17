import {Element, NewElementBuilder} from './Element';
import {ValidityChangedEvent} from '../ValidityChangedEvent';

export class FormItemEl
    extends Element {

    private enabled: boolean = true;

    private validityChangedListeners: ((event: ValidityChangedEvent) => void)[] = [];

    constructor(tagName: string, className?: string, prefix?: string) {
        super(new NewElementBuilder().setTagName(tagName).setClassName(className, prefix));
    }

    getName(): string {
        return this.getEl().getAttribute('name');
    }

    setName(name: string): FormItemEl {
        this.getEl().setAttribute('name', name);
        return this;
    }

    onValidityChanged(listener: (event: ValidityChangedEvent) => void) {
        this.validityChangedListeners.push(listener);
    }

    unValidityChanged(listener: (event: ValidityChangedEvent) => void) {
        this.validityChangedListeners = this.validityChangedListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    notifyValidityChanged(valid: boolean) {
        this.validityChangedListeners.forEach((listener: (event: ValidityChangedEvent) => void) => {
            listener.call(this, new ValidityChangedEvent(valid));
        });
    }

    setEnabled(enable: boolean) {
        this.enabled = enable;
        this.toggleClass('disabled', !enable);
    }

    isEnabled(): boolean {
        return this.enabled;
    }

}
