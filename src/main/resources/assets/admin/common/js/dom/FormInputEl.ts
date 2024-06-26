import {ClassHelper} from '../ClassHelper';
import {ObjectHelper} from '../ObjectHelper';
import {StringHelper} from '../util/StringHelper';
import {ValueChangedEvent} from '../ValueChangedEvent';
import {FormItemEl} from './FormItemEl';

export class FormInputEl
    extends FormItemEl {

    public static debug: boolean = false;
    private dirtyChangedListeners: ((dirty: boolean) => void)[] = [];
    private valueChangedListeners: ((event: ValueChangedEvent) => void)[] = [];
    private originalValue: string;
    private oldValue: string;
    private dirty: boolean;

    constructor(tagName: string, className?: string, prefix?: string, originalValue = '') {
        super(tagName, className, prefix);
        this.addClass('form-input');

        this.originalValue = originalValue;
        this.oldValue = '';
        this.dirty = false;

        if (FormInputEl.debug) {
            console.groupCollapsed(this.toString() + '.constructor: setting originalValue = ' +
                                   this.originalValue + ', oldValue = ' + this.oldValue);
        }

        const initListenersOnce = () => {
            this.onChange(() => {
                this.refreshDirtyState();
                this.refreshValueChanged();
            });

            if (!StringHelper.isBlank(this.originalValue)) {
                if (FormInputEl.debug) {
                    console.debug(`${this.toString()}.onAdded: setting original value = "${this.originalValue}"`);
                }
                // use this prototype's setValue because descendants might override setValue method (i.e. CheckBox, RadioGroup)
                FormInputEl.prototype.setValue.call(this, this.originalValue, true);
            }
            this.unAdded(initListenersOnce);
        };

        // Descendant class might override my methods
        // therefore set value on added to make sure it's ready
        this.onAdded(initListenersOnce);

        if (FormInputEl.debug) {
            console.groupEnd();
        }
    }

    getValue(): string {
        return this.doGetValue();
    }

    /**
     * Takes care of the set value routine.
     * Note that it behaves differently for different elements:
     * "button", "reset", and "submit" - defines the text on the button
     * "text", "password", and "hidden" - defines the initial (default) value
     * "checkbox", "radio", "image" - defines the value sent on submit
     * @param value
     * @param silent
     * @param userInput indicates that dirty flag should be updated,
     * otherwise original value will be updated if not dirty
     * @returns {FormInputEl}
     */
    setValue(value: string, silent?: boolean, userInput?: boolean): FormInputEl {
        if (FormInputEl.debug) {
            console.groupCollapsed(this.toString() + '.setValue(' + value + ')');
        }
        // force set value in case of user input regardless of old value
        if ((this.oldValue !== value || this.isSameValueUpdateAllowed()) || userInput) {
            if (FormInputEl.debug) {
                console.debug(`update value from "${this.oldValue}" to "${value}"`);
            }
            this.doSetValue(value);
            this.refreshValueChanged(silent);

            if (!userInput && !this.dirty && this.originalValue !== value) {
                // update original value if not dirty and not user input
                // to keep the dirty state consistent
                if (FormInputEl.debug) {
                    console.debug(`not dirty and not user input, update originalValue from "${this.originalValue}" to "${value}"`);
                }
                this.originalValue = value ? String(value) : '';
            } else {
                // update dirty according to new value and original value
                // to keep dirty state consistent
                this.refreshDirtyState(silent);
            }
        } else {
            if (FormInputEl.debug) {
                console.debug('oldValue is equal to new value = ' + value + ', skipping setValue...');
            }
        }
        if (FormInputEl.debug) {
            console.groupEnd();
        }
        return this;
    }

    forceChangedEvent() {
        this.notifyValueChanged(new ValueChangedEvent(this.oldValue, this.getValue()));
    }

    isDirty(): boolean {
        return this.dirty;
    }

    toString(): string {
        return ClassHelper.getClassName(this) + '[' + this.getId() + ']';
    }

    public resetBaseValues() {
        this.originalValue = this.getValue();
        this.oldValue = this.originalValue;
        this.dirty = false;
    }

    clear(): void {
        this.setValue('');
    }

    onChange(listener: (event: Event) => void) {
        this.getEl().addEventListener('change', listener);
    }

    unChange(listener: (event: Event) => void) {
        this.getEl().removeEventListener('change', listener);
    }

    onInput(listener: (event: Event) => void) {
        this.getEl().addEventListener('input', listener);
    }

    unInput(listener: (event: Event) => void) {
        this.getEl().removeEventListener('input', listener);
    }

    onDirtyChanged(listener: (dirty: boolean) => void) {
        this.dirtyChangedListeners.push(listener);
    }

    unDirtyChanged(listener: (dirty: boolean) => void) {
        this.dirtyChangedListeners = this.dirtyChangedListeners.filter((curr) => {
            return listener !== curr;
        });
    }

    onValueChanged(listener: (event: ValueChangedEvent) => void) {
        this.valueChangedListeners.push(listener);
    }

    unValueChanged(listener: (event: ValueChangedEvent) => void) {
        this.valueChangedListeners = this.valueChangedListeners.filter((curr) => {
            return listener !== curr;
        });
    }

    protected getOriginalValue(): string {
        return this.originalValue;
    }

    /**
     * Gets value of the input (i.e gets checked for checkbox, instead of the value attribute)
     * @returns {string}
     */
    protected doGetValue(): string {
        return this.getEl().getValue();
    }

    /**
     * Does actual value setting (i.e sets input value, or checked for checkbox, instead of value attribute)
     * all necessary events are thrown in wrapping setValue
     * @param value
     * @param silent
     */
    protected doSetValue(value: string) {
        this.getEl().setValue(value);
    }

    protected isSameValueUpdateAllowed(): boolean {
        return false;
    }

    /**
     * Call to refresh dirty state and fire an event if input was changed outside setValue
     * @param silent
     */
    protected refreshDirtyState(silent?: boolean) {
        this.setDirty(this.calculateDirty(), silent);
    }

    /**
     * Call to refresh old value and fire an event if input was changed outside setValue
     * @param silent
     */
    protected refreshValueChanged(silent?: boolean) {
        let value = this.doGetValue();

        if (this.oldValue !== value) {
            if (FormInputEl.debug) {
                console.debug(this.toString() + ' value changed from "' + this.oldValue + '" to "' + value + '"');
            }
            if (!silent) {
                this.notifyValueChanged(new ValueChangedEvent(this.oldValue, value));
            }
            this.oldValue = '' + value;
        } else {
            if (FormInputEl.debug) {
                console.debug('oldValue is equal to new value = ' + value + ', skipping refreshValueChanged...');
            }
        }
    }

    private calculateDirty(): boolean {
        return !ObjectHelper.stringEquals(this.originalValue, this.doGetValue());
    }

    private setDirty(dirty: boolean, silent?: boolean) {
        if (this.dirty !== dirty) {
            this.dirty = dirty;
            if (FormInputEl.debug) {
                console.debug(this.toString() + ' dirty changed to ' + dirty);
            }
            if (!silent) {
                this.notifyDirtyChanged(dirty);
            }
        }
    }

    private notifyDirtyChanged(dirty: boolean) {
        this.dirtyChangedListeners.forEach((listener) => {
            listener(dirty);
        });
    }

    private notifyValueChanged(event: ValueChangedEvent) {
        this.valueChangedListeners.forEach((listener) => {
            listener(event);
        });
    }
}
