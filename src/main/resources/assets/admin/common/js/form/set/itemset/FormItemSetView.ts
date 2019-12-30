import {PropertySet} from '../../../data/PropertySet';
import {FormContext} from '../../FormContext';
import {FormItemSet} from './FormItemSet';
import {FormItemSetOccurrenceView} from './FormItemSetOccurrenceView';
import {FormSetView} from '../FormSetView';
import {FormItemViewConfig} from '../../FormItemView';
import {FormSetOccurrences} from '../FormSetOccurrences';
import {FormItemSetOccurrences, FormItemSetOccurrencesConfig} from './FormItemSetOccurrences';
import {FormItemLayerFactory} from '../../FormItemLayerFactory';

export interface FormItemSetViewConfig {

    context: FormContext;

    layerFactory: FormItemLayerFactory;

    formItemSet: FormItemSet;

    parent: FormItemSetOccurrenceView;

    parentDataSet: PropertySet;

    occurrencesLazyRender?: boolean;
}

export class FormItemSetView
    extends FormSetView<FormItemSetOccurrenceView> {

    private occurrencesLazyRender: boolean;

    protected layerFactory: FormItemLayerFactory;

    constructor(config: FormItemSetViewConfig) {
        super(<FormItemViewConfig> {
            className: 'form-item-set-view',
            context: config.context,
            formItem: config.formItemSet,
            parent: config.parent
        });
        this.layerFactory = config.layerFactory;
        this.parentDataSet = config.parentDataSet;
        this.formSet = config.formItemSet;
        this.classPrefix = 'form-item-set';
        this.helpText = this.formSet.getHelpText();
        this.occurrencesLazyRender = config.occurrencesLazyRender;

        this.addClass(this.formSet.getPath().getElements().length % 2 ? 'even' : 'odd');
        if (this.formSet.getOccurrences().getMaximum() === 1) {
            this.addClass('max-1-occurrence');
        }

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
