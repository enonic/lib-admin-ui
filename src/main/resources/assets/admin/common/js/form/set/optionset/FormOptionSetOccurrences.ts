import {FormOptionSetOccurrenceView} from './FormOptionSetOccurrenceView';
import {FormSetOccurrences} from '../FormSetOccurrences';
import {FormSetOccurrenceViewConfig} from '../FormSetOccurrenceView';

export class FormOptionSetOccurrences
    extends FormSetOccurrences<FormOptionSetOccurrenceView> {

    protected createOccurrenceView(config: FormSetOccurrenceViewConfig<FormOptionSetOccurrenceView>): FormOptionSetOccurrenceView {
        return new FormOptionSetOccurrenceView(config);
    }
}
