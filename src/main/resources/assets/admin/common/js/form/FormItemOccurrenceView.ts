import Q = require('q');
import {DivEl} from '../dom/DivEl';
import {PropertyPath} from '../data/PropertyPath';
import {InputValidationRecording} from './inputtype/InputValidationRecording';
import {FormItemOccurrence} from './FormItemOccurrence';
import {HelpTextContainer} from './HelpTextContainer';
import {RemoveButtonClickedEvent} from './RemoveButtonClickedEvent';

export abstract class FormItemOccurrenceView
    extends DivEl {

    protected formItemOccurrence: FormItemOccurrence<FormItemOccurrenceView>;
    protected helpText: HelpTextContainer;
    private removeButtonClickedListeners: { (event: RemoveButtonClickedEvent<FormItemOccurrenceView>): void }[] = [];
    private occurrenceChangedListeners: { (view: FormItemOccurrenceView): void }[] = [];

    constructor(className: string, formItemOccurrence: FormItemOccurrence<FormItemOccurrenceView>) {
        super(className);
        this.formItemOccurrence = formItemOccurrence;
    }

    isExpandable(): boolean {
        return false;
    }

    toggleHelpText(show?: boolean) {
        if (!!this.helpText) {
            this.helpText.toggleHelpText(show);
        }
    }

    hasHelpText(): boolean {
        return !!this.helpText;
    }

    reset() {
        throw new Error('Must be implemented by inheritor');
    }

    getDataPath(): PropertyPath {
        throw new Error('Must be implemented by inheritor');
    }

    public layout(_validate: boolean = true): Q.Promise<void> {
        return Q<void>(null);
    }

    hasValidUserInput(): boolean {
        throw new Error('Must be implemented by inheritor');
    }

    onRemoveButtonClicked(listener: (event: RemoveButtonClickedEvent<FormItemOccurrenceView>) => void) {
        this.removeButtonClickedListeners.push(listener);
    }

    unRemoveButtonClicked(listener: (event: RemoveButtonClickedEvent<FormItemOccurrenceView>) => void) {
        this.removeButtonClickedListeners.filter((currentListener: (event: RemoveButtonClickedEvent<FormItemOccurrenceView>) => void) => {
            return currentListener !== listener;
        });
    }

    notifyRemoveButtonClicked() {
        this.removeButtonClickedListeners.forEach((listener: (event: RemoveButtonClickedEvent<FormItemOccurrenceView>) => void) => {
            listener.call(this, new RemoveButtonClickedEvent(this));
        });
    }

    onOccurrenceChanged(listener: (view: FormItemOccurrenceView) => void): void {
        this.occurrenceChangedListeners.push(listener);
    }

    unOccurrenceChanged(listener: (view: FormItemOccurrenceView) => void): void {
        this.occurrenceChangedListeners.filter((currentListener: (view: FormItemOccurrenceView) => void) => {
            return currentListener !== listener;
        });
    }

    protected notifyOccurrenceChanged(view?: FormItemOccurrenceView) {
        this.occurrenceChangedListeners.forEach((listener: (view: FormItemOccurrenceView) => void) => listener(view || this));
    }

    getIndex(): number {
        return this.formItemOccurrence.getIndex();
    }

    refresh() {
        throw new Error('Must be implemented by inheritor');
    }

    hasNonDefaultValues(): boolean {
        return false;
    }

    isEmpty(): boolean {
        throw false;
    }

    clean() {
        // empty
    }

    giveFocus(): boolean {
        return false;
    }

    setEnabled(enable: boolean) {
        //
    }
}
