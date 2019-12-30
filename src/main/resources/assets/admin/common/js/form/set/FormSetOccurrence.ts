import {FormSetOccurrenceView} from './FormSetOccurrenceView';
import {FormItemOccurrence} from '../FormItemOccurrence';
import {FormSetOccurrences} from './FormSetOccurrences';

export class FormSetOccurrence<V extends FormSetOccurrenceView>
    extends FormItemOccurrence<V> {

    constructor(formSetOccurrences: FormSetOccurrences<V>, index: number) {
        super(formSetOccurrences, index, formSetOccurrences.getFormSet().getOccurrences());
    }
}
