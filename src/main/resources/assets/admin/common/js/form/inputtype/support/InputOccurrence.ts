import {FormItemOccurrence} from '../../FormItemOccurrence';
import {InputOccurrenceView} from './InputOccurrenceView';
import {InputOccurrences} from './InputOccurrences';

/*
 * Represents an occurrence or value of many. Translates to a Property in the data domain.
 */
export class InputOccurrence
    extends FormItemOccurrence<InputOccurrenceView> {

    constructor(inputOccurrences: InputOccurrences, index: number) {
        super(inputOccurrences, index, inputOccurrences.getInput().getOccurrences());
    }
}
