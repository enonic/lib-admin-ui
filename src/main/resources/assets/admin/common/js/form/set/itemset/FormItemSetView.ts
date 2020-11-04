import {FormItemSetOccurrenceView} from './FormItemSetOccurrenceView';
import {FormSetView, FormSetViewConfig} from '../FormSetView';
import {FormSetOccurrencesConfig} from '../FormSetOccurrences';
import {FormItemSetOccurrences} from './FormItemSetOccurrences';

export class FormItemSetView
    extends FormSetView<FormItemSetOccurrenceView> {

    constructor(config: FormSetViewConfig) {
        super(config, 'form-item-set');
    }

    protected createOccurrences(config: FormSetOccurrencesConfig<FormItemSetOccurrenceView>): FormItemSetOccurrences {
        return new FormItemSetOccurrences(config);
    }
}
