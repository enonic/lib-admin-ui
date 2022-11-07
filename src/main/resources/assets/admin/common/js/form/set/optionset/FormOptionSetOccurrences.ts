import {FormOptionSetOccurrenceView} from './FormOptionSetOccurrenceView';
import {FormSetOccurrences} from '../FormSetOccurrences';
import {FormSetOccurrenceViewConfig} from '../FormSetOccurrenceView';
import {Occurrences} from '../../Occurrences';
import {FormOptionSet} from './FormOptionSet';
import {FormOptionSetOccurrenceViewSingleOption} from './FormOptionSetOccurrenceViewSingleOption';
import {FormOptionSetOccurrenceViewMultiOptions} from './FormOptionSetOccurrenceViewMultiOptions';

export class FormOptionSetOccurrences
    extends FormSetOccurrences<FormOptionSetOccurrenceView> {

    protected createFormSetOccurrenceView(config: FormSetOccurrenceViewConfig<FormOptionSetOccurrenceView>): FormOptionSetOccurrenceView {
        return this.isSingleSelection() ?
               new FormOptionSetOccurrenceViewSingleOption(config) :
               new FormOptionSetOccurrenceViewMultiOptions(config);
    }

    private isSingleSelection(): boolean {
        const multi: Occurrences = (<FormOptionSet>this.getFormSet()).getMultiselection();
        return multi.getMinimum() === 1 && multi.getMaximum() === 1;
    }
}
