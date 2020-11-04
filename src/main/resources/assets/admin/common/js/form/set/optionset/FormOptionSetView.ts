import {FormOptionSetOccurrenceView} from './FormOptionSetOccurrenceView';
import {FormSetView, FormSetViewConfig} from '../FormSetView';
import {FormSetOccurrencesConfig} from '../FormSetOccurrences';
import {FormOptionSetOccurrences} from './FormOptionSetOccurrences';

export class FormOptionSetView
    extends FormSetView<FormOptionSetOccurrenceView> {

    constructor(config: FormSetViewConfig) {
        super(config, 'form-option-set');
    }

    protected createOccurrences(config: FormSetOccurrencesConfig<FormOptionSetOccurrenceView>): FormOptionSetOccurrences {
        return new FormOptionSetOccurrences(config);
    }
}
