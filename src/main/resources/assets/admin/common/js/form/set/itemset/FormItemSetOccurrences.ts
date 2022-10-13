import {FormItemSetOccurrenceView} from './FormItemSetOccurrenceView';
import {FormSetOccurrences} from '../FormSetOccurrences';
import {FormSetOccurrenceViewConfig} from '../FormSetOccurrenceView';

/*
 * A kind of a controller, which adds/removes FormItemSetOccurrenceView-s
 */
export class FormItemSetOccurrences
    extends FormSetOccurrences<FormItemSetOccurrenceView> {

    protected createFormSetOccurrenceView(config: FormSetOccurrenceViewConfig<FormItemSetOccurrenceView>): FormItemSetOccurrenceView {
        return new FormItemSetOccurrenceView(config);
    }
}
