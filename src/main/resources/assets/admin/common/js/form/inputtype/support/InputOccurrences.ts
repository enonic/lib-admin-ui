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

    private baseInputTypeView: BaseInputTypeNotManagingAdd;

    private input: Input;

    constructor(config: InputOccurrencesBuilder) {
        super(<FormItemOccurrencesConfig>{
            formItem: config.input,
            propertyArray: config.propertyArray,
            occurrenceViewContainer: config.baseInputTypeView,
            allowedOccurrences: config.input.getOccurrences()
        });
        this.baseInputTypeView = config.baseInputTypeView;
        this.input = config.input;
    }

    public static create(): InputOccurrencesBuilder {
        return new InputOccurrencesBuilder();
    }

    hasValidUserInput(recording?: InputValidationRecording): boolean {
        let result = true;
        this.getOccurrenceViews().forEach((formItemOccurrenceView: FormItemOccurrenceView) => {

            if (!formItemOccurrenceView.hasValidUserInput(recording)) {
                result = false;
            }
        });
        return result;
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

    createNewOccurrence(formItemOccurrences: FormItemOccurrences<InputOccurrenceView>,
                        insertAtIndex: number): FormItemOccurrence<InputOccurrenceView> {
        return new InputOccurrence(<InputOccurrences>formItemOccurrences, insertAtIndex);
    }

    createNewOccurrenceView(occurrence: InputOccurrence): InputOccurrenceView {

        let property = this.getPropertyFromArray(occurrence.getIndex());
        let inputOccurrenceView: InputOccurrenceView = new InputOccurrenceView(occurrence, this.baseInputTypeView, property);

        let inputOccurrences: InputOccurrences = this;
        inputOccurrenceView.onRemoveButtonClicked((event: RemoveButtonClickedEvent<InputOccurrenceView>) => {
            inputOccurrences.removeOccurrenceView(event.getView());
        });

        return inputOccurrenceView;
    }

    updateOccurrenceView(occurrenceView: InputOccurrenceView, propertyArray: PropertyArray,
                         unchangedOnly?: boolean): Q.Promise<void> {
        this.propertyArray = propertyArray;

        return occurrenceView.update(propertyArray, unchangedOnly);
    }

    resetOccurrenceView(occurrenceView: InputOccurrenceView) {
        occurrenceView.reset();
    }

    giveFocus(): boolean {

        let focusGiven = false;
        let occurrenceViews = this.getOccurrenceViews();
        if (occurrenceViews.length > 0) {
            for (let i = 0; i < occurrenceViews.length; i++) {
                if (occurrenceViews[i].giveFocus()) {
                    focusGiven = true;
                    break;
                }
            }
        }
        return focusGiven;
    }

    protected constructOccurrencesForNoData(): FormItemOccurrence<InputOccurrenceView>[] {
        let occurrences: FormItemOccurrence<InputOccurrenceView>[] = [];
        if (this.getAllowedOccurrences().getMinimum() > 0) {

            for (let i = 0; i < this.getAllowedOccurrences().getMinimum(); i++) {
                occurrences.push(this.createNewOccurrence(this, i));
            }
        } else {
            occurrences.push(this.createNewOccurrence(this, 0));
        }
        return occurrences;
    }

    protected constructOccurrencesForData(): FormItemOccurrence<InputOccurrenceView>[] {
        let occurrences: FormItemOccurrence<InputOccurrenceView>[] = [];

        this.propertyArray.forEach((_property: Property, index: number) => {
            occurrences.push(this.createNewOccurrence(this, index));
        });

        if (occurrences.length < this.input.getOccurrences().getMinimum()) {
            for (let index: number = occurrences.length; index < this.input.getOccurrences().getMinimum(); index++) {
                occurrences.push(this.createNewOccurrence(this, index));
            }
        }
        return occurrences;
    }

    private getPropertyFromArray(index: number): Property {
        let property = this.propertyArray.get(index);
        if (!property) {
            let newInitialValue = this.baseInputTypeView.newInitialValue();
            assertNotNull(newInitialValue,
                'InputTypeView-s extending BaseInputTypeNotManagingAdd must must return a Value from newInitialValue');
            property = this.propertyArray.add(newInitialValue);
        }
        return property;
    }
}
