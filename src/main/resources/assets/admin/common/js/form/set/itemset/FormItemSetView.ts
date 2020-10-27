import {FormItemSet} from './FormItemSet';
import {FormItemSetOccurrenceView} from './FormItemSetOccurrenceView';
import {FormSetView, FormSetViewConfig} from '../FormSetView';
import {FormSetOccurrences} from '../FormSetOccurrences';
import {FormItemSetOccurrences, FormItemSetOccurrencesConfig} from './FormItemSetOccurrences';

export class FormItemSetView
    extends FormSetView<FormItemSetOccurrenceView> {

    constructor(config: FormSetViewConfig) {
        super(config, 'form-item-set');
    }

    protected initOccurrences(): FormSetOccurrences<FormItemSetOccurrenceView> {
        return this.formItemOccurrences = new FormItemSetOccurrences(<FormItemSetOccurrencesConfig>{
            context: this.getContext(),
            layerFactory: this.layerFactory,
            occurrenceViewContainer: this.occurrenceViewsContainer,
            formItemSet: <FormItemSet> this.formSet,
            parent: this.getParent(),
            propertyArray: this.getPropertyArray(this.parentDataSet),
            lazyRender: this.occurrencesLazyRender
        });
    }
}
