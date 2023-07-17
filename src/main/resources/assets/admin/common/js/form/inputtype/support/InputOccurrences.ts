import * as Q from 'q';
import {Property} from '../../../data/Property';
import {PropertyArray} from '../../../data/PropertyArray';
import {Input} from '../../Input';
import {FormItemOccurrences, FormItemOccurrencesConfig} from '../../FormItemOccurrences';
import {InputValidationRecording} from '../InputValidationRecording';
import {Occurrences} from '../../Occurrences';
import {FormItemOccurrence} from '../../FormItemOccurrence';
import {RemoveButtonClickedEvent} from '../../RemoveButtonClickedEvent';
import {BaseInputTypeNotManagingAdd} from './BaseInputTypeNotManagingAdd';
import {InputOccurrenceView} from './InputOccurrenceView';
import {FormItemOccurrenceView} from '../../FormItemOccurrenceView';
import {InputOccurrence} from './InputOccurrence';
import {assertNotNull} from '../../../util/Assert';
import {Value} from '../../../data/Value';

export class InputOccurrencesBuilder {

    baseInputTypeView: BaseInputTypeNotManagingAdd;

    input: Input;

    propertyArray: PropertyArray;

    setBaseInputTypeView(value: BaseInputTypeNotManagingAdd): InputOccurrencesBuilder {
        this.baseInputTypeView = value;
        return this;
    }

    setInput(value: Input): InputOccurrencesBuilder {
        this.input = value;
        return this;
    }

    setPropertyArray(value: PropertyArray): InputOccurrencesBuilder {
        this.propertyArray = value;
        return this;
    }

    build(): InputOccurrences {
        return new InputOccurrences(this);
    }
}

/*
 * A kind of a controller, which add/remove InputOccurrenceView-s to the BaseInputTypeView
 */
export class InputOccurrences
    extends FormItemOccurrences<InputOccurrenceView> {

    private readonly baseInputTypeView: BaseInputTypeNotManagingAdd;

    private readonly input: Input;

    constructor(config: InputOccurrencesBuilder) {
        super({
            formItem: config.input,
            propertyArray: config.propertyArray,
            occurrenceViewContainer: config.baseInputTypeView,
            allowedOccurrences: config.input.getOccurrences()
        } as FormItemOccurrencesConfig);
        this.baseInputTypeView = config.baseInputTypeView;
        this.input = config.input;
    }

    public static create(): InputOccurrencesBuilder {
        return new InputOccurrencesBuilder();
    }

    hasValidUserInput(): boolean {
        return this.getOccurrenceViews().every((occurrenceView: FormItemOccurrenceView) => occurrenceView.hasValidUserInput());
    }

    moveOccurrence(fromIndex: number, toIndex: number) {

        super.moveOccurrence(fromIndex, toIndex);
    }

    getInput(): Input {
        return this.input;
    }

    getAllowedOccurrences(): Occurrences {
        return this.input.getOccurrences();
    }

    createOccurrence(formItemOccurrences: FormItemOccurrences<InputOccurrenceView>,
                     insertAtIndex: number): FormItemOccurrence<InputOccurrenceView> {
        return new InputOccurrence(formItemOccurrences as InputOccurrences, insertAtIndex);
    }

    createOccurrenceView(occurrence: InputOccurrence): InputOccurrenceView {
        const property: Property = this.getOrPopulatePropertyFromArray(occurrence.getIndex());
        const inputOccurrenceView: InputOccurrenceView = new InputOccurrenceView(occurrence, this.baseInputTypeView, property);

        inputOccurrenceView.onRemoveButtonClicked((event: RemoveButtonClickedEvent<InputOccurrenceView>) => {
            this.removeOccurrenceView(event.getView());
        });

        return inputOccurrenceView;
    }

    updateOccurrenceView(occurrenceView: InputOccurrenceView, unchangedOnly?: boolean): Q.Promise<void> {
        const property: Property = this.getOrPopulatePropertyFromArray(occurrenceView.getIndex());
        return occurrenceView.update(property, unchangedOnly);
    }

    giveFocus(): boolean {
        return this.getOccurrenceViews().some((view: InputOccurrenceView) => view.giveFocus());
    }

    private getOrPopulatePropertyFromArray(index: number): Property {
        let property: Property = this.propertyArray.get(index);

        if (!property) {
            const newInitialValue: Value = this.baseInputTypeView.newInitialValue();
            assertNotNull(newInitialValue,
                'InputTypeView-s extending BaseInputTypeNotManagingAdd must must return a Value from newInitialValue');
            property = this.propertyArray.add(newInitialValue);
        }

        return property;
    }
}
