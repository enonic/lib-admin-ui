import {FormOptionSet} from './FormOptionSet';
import {FormOptionSetOccurrenceView} from './FormOptionSetOccurrenceView';
import {FormSetView, FormSetViewConfig} from '../FormSetView';
import {FormSetOccurrences} from '../FormSetOccurrences';
import {FormOptionSetOccurrences, FormOptionSetOccurrencesConfig} from './FormOptionSetOccurrences';

export class FormOptionSetView
    extends FormSetView<FormOptionSetOccurrenceView> {

    constructor(config: FormSetViewConfig) {
        super(config, 'form-option-set');
    }

    protected initOccurrences(): FormSetOccurrences<FormOptionSetOccurrenceView> {
        return this.formItemOccurrences = new FormOptionSetOccurrences(<FormOptionSetOccurrencesConfig>{
            context: this.getContext(),
            layerFactory: this.layerFactory,
            occurrenceViewContainer: this.occurrenceViewsContainer,
            formOptionSet: <FormOptionSet> this.formSet,
            parent: this.getParent(),
            propertyArray: this.getPropertyArray(this.parentDataSet),
            lazyRender: this.occurrencesLazyRender
        });
    }
}
