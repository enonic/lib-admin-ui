import * as Q from 'q';
import {PropertySet} from '../data/PropertySet';
import {DivEl} from '../dom/DivEl';
import {FormContext} from './FormContext';
import {FormItem} from './FormItem';
import {FormItemOccurrenceView} from './FormItemOccurrenceView';
import {assertNotNull} from '../util/Assert';
import {ValidationRecording} from './ValidationRecording';
import {RecordingValidityChangedEvent} from './RecordingValidityChangedEvent';

export interface FormItemViewConfig {

    className: string;

    context: FormContext;

    formItem: FormItem;

    parent: FormItemOccurrenceView;
}

export class FormItemView
    extends DivEl {

    private context: FormContext;

    private formItem: FormItem;

    protected validityChangedListeners: ((event: RecordingValidityChangedEvent) => void)[] = [];

    private hideErrorsUntilValidityChange: boolean = false;

    protected originalValidityChanged: boolean = false;

    protected previousValidationRecording: ValidationRecording;

    protected parent: FormItemOccurrenceView;

    constructor(config: FormItemViewConfig) {
        super(config.className);
        assertNotNull(config.context, 'context cannot be null');
        assertNotNull(config.formItem, 'formItem cannot be null');
        this.context = config.context;
        this.formItem = config.formItem;
        this.parent = config.parent;
    }

    public setHideErrorsUntilValidityChange(flag: boolean) {
        this.hideErrorsUntilValidityChange = flag;

        this.toggleClass('hide-validation-errors', this.isHideValidationErrors());
    }

    public isHideErrorsUntilValidityChange(): boolean {
        return this.hideErrorsUntilValidityChange;
    }

    protected isHideValidationErrors(): boolean {
        return !this.originalValidityChanged && this.isHideErrorsUntilValidityChange();
    }

    broadcastFormSizeChanged() {
        throw new Error('Must be implemented by inheritors');
    }

    layout(validate: boolean = true): Q.Promise<void> {
        throw new Error('Must be implemented by inheritors');
    }

    postLayout(validate: boolean = true): Q.Promise<void> {
        this.onValidityChanged((event: RecordingValidityChangedEvent) => {
            if (this.previousValidationRecording) {
                if (this.previousValidationRecording.isValid() != event.isValid()) {
                    this.originalValidityChanged = true;
                }
            }

            this.previousValidationRecording = event.getRecording();
            const isValid = event.isValid();
            this.toggleClass('invalid', !isValid);
            this.toggleClass('valid', isValid);
            this.toggleClass('hide-validation-errors', this.isHideValidationErrors());
        });

        return Q();
    }

    isValid(): boolean {
        if (!this.previousValidationRecording) {
            return true;
        }

        return this.previousValidationRecording.isValid();
    }

    update(_propertyArray: PropertySet, _unchangedOnly?: boolean): Q.Promise<void> {
        throw new Error('Must be implemented by inheritors');
    }

    reset() {
        this.originalValidityChanged = false;
    }

    clean(): void {
        //to be implemented on demand in inheritors
    }

    clear(): void {
        //to be implemented on demand in inheritors
    }

    refresh(): void {
        //to be implemented on demand in inheritors
    }

    isExpandable(): boolean {
        return false;
    }

    hasNonDefaultValues(): boolean {
        return false; //to be implemented on demand in inheritors
    }

    hasNonDefaultNumberOfOccurrences(): boolean {
        return false; //to be implemented on demand in inheritors
    }

    isEmpty(): boolean {
        throw new Error('Must be implemented by inheritor');
    }

    getContext(): FormContext {
        return this.context;
    }

    getFormItem(): FormItem {
        return this.formItem;
    }

    getParent(): FormItemOccurrenceView {
        return this.parent;
    }

    public displayValidationErrors(_value: boolean) {
        throw new Error('Must be implemented by inheritor');
    }

    hasValidUserInput(): boolean {
        throw new Error('Must be implemented by inheritor');
    }

    validate(_silent: boolean = true): ValidationRecording {

        // Default method to avoid having to implement method in Layout-s.
        return new ValidationRecording();
    }

    giveFocus(): boolean {
        return false;
    }

    onValidityChanged(listener: (event: RecordingValidityChangedEvent) => void) {
        this.validityChangedListeners.push(listener);
    }

    unValidityChanged(listener: (event: RecordingValidityChangedEvent) => void) {
        this.validityChangedListeners.filter((currentListener: (event: RecordingValidityChangedEvent) => void) => {
            return listener === currentListener;
        });
    }

    protected notifyValidityChanged(event: RecordingValidityChangedEvent) {
        this.validityChangedListeners.forEach((listener: (event: RecordingValidityChangedEvent) => void) => {
            listener(event);
        });
    }

    toggleHelpText(_show?: boolean) {
        // TO BE IMPLEMENTED BY INHERITORS
    }

    hasHelpText(): boolean {
        return false;
    }

    setEnabled(enable: boolean) {
        //
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.addClass('form-item-view');
            return rendered;
        });
    }
}
