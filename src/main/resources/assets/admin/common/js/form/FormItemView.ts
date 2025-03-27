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

    protected parent: FormItemOccurrenceView;

    private highlightOnValidityChanged: boolean;

    constructor(config: FormItemViewConfig) {
        super(config.className);
        assertNotNull(config.context, 'context cannot be null');
        assertNotNull(config.formItem, 'formItem cannot be null');
        this.context = config.context;
        this.formItem = config.formItem;
        this.parent = config.parent;
        this.highlightOnValidityChanged = false;
    }

    public setHighlightOnValidityChange(highlight: boolean) {
        this.highlightOnValidityChanged = highlight;
    }

    broadcastFormSizeChanged() {
        throw new Error('Must be implemented by inheritors');
    }

    layout(validate: boolean = true): Q.Promise<void> {
        throw new Error('Must be implemented by inheritors');
    }

    update(_propertyArray: PropertySet, _unchangedOnly?: boolean): Q.Promise<void> {
        throw new Error('Must be implemented by inheritors');
    }

    reset() {
        throw new Error('Must be implemented by inheritors');
    }

    clean(): void {
        //to be implemented on demand in inheritors
    }

    clear(): void {
        //to be implemented on demand in inheritors
    }

    refresh() {
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

    highlightOnValidityChange(): boolean {
        return this.highlightOnValidityChanged;
    }

    onValidityChanged(_listener: (event: RecordingValidityChangedEvent) => void) {
        //Should be implemented in child classes
    }

    unValidityChanged(_listener: (event: RecordingValidityChangedEvent) => void) {
        //Should be implemented in child classes
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
