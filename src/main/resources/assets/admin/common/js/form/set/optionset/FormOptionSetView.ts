import {PropertySet} from '../../../data/PropertySet';
import {FormContext} from '../../FormContext';
import {FormOptionSet} from './FormOptionSet';
import {FormOptionSetOccurrenceView} from './FormOptionSetOccurrenceView';
import {FormSetView} from '../FormSetView';
import {FormItemViewConfig} from '../../FormItemView';
import {FormSetOccurrences} from '../FormSetOccurrences';
import {FormOptionSetOccurrences, FormOptionSetOccurrencesConfig} from './FormOptionSetOccurrences';
import {FormItemLayerFactory} from '../../FormItemLayerFactory';

export interface FormOptionSetViewConfig {

    layerFactory: FormItemLayerFactory;

    context: FormContext;

    formOptionSet: FormOptionSet;

    parent: FormOptionSetOccurrenceView;

    parentDataSet: PropertySet;
}

export class FormOptionSetView
    extends FormSetView<FormOptionSetOccurrenceView> {

    protected layerFactory: FormItemLayerFactory;

    constructor(config: FormOptionSetViewConfig) {
        super(<FormItemViewConfig> {
            className: 'form-option-set-view',
            context: config.context,
            formItem: config.formOptionSet,
            parent: config.parent
        });
        this.layerFactory = config.layerFactory;
        this.parentDataSet = config.parentDataSet;
        this.formSet = config.formOptionSet;
        this.classPrefix = 'form-option-set';
        this.helpText = this.formSet.getHelpText();

        this.addClass(this.formSet.getPath().getElements().length % 2 ? 'even' : 'odd');
        if (this.formSet.getOccurrences().getMaximum() === 1) {
            this.addClass('max-1-occurrence');
        }
    }

    protected initOccurrences(): FormSetOccurrences<FormOptionSetOccurrenceView> {
        return this.formItemOccurrences = new FormOptionSetOccurrences(<FormOptionSetOccurrencesConfig>{
            layerFactory: this.layerFactory,
            context: this.getContext(),
            occurrenceViewContainer: this.occurrenceViewsContainer,
            formOptionSet: <FormOptionSet> this.formSet,
            parent: this.getParent(),
            propertyArray: this.getPropertyArray(this.parentDataSet)
        });
    }
}
