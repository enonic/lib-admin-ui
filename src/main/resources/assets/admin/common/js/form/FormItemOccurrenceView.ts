import * as Q from 'q';
import {PropertyArray} from '../data/PropertyArray';
import {DivEl} from '../dom/DivEl';
import {PropertyPath} from '../data/PropertyPath';
import {InputValidationRecording} from './inputtype/InputValidationRecording';
import {FormItemOccurrence} from './FormItemOccurrence';
import {HelpTextContainer} from './HelpTextContainer';
import {RemoveButtonClickedEvent} from './RemoveButtonClickedEvent';

export class FormItemOccurrenceView
    extends DivEl {

    protected formItemOccurrence: FormItemOccurrence<FormItemOccurrenceView>;
    protected helpText: HelpTextContainer;
    private removeButtonClickedListeners: { (event: RemoveButtonClickedEvent<FormItemOccurrenceView>): void }[] = [];

    constructor(className: string, formItemOccurrence: FormItemOccurrence<FormItemOccurrenceView>) {
        super(className);
        this.formItemOccurrence = formItemOccurrence;
    }

    toggleHelpText(show?: boolean) {
        if (!!this.helpText) {
            this.helpText.toggleHelpText(show);
        }
    }

    getDataPath(): PropertyPath {
        throw new Error('Must be implemented by inheritor');
    }

    public layout(_validate: boolean = true): Q.Promise<void> {
        return Q<void>(null);
    }

    public update(_propertyArray: PropertyArray, _unchangedOnly?: boolean): Q.Promise<void> {
        return Q<void>(null);
    }

    hasValidUserInput(_recording?: InputValidationRecording): boolean {

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
