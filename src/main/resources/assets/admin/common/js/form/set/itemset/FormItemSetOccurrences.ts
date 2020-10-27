import {PropertyArray} from '../../../data/PropertyArray';
import {Element} from '../../../dom/Element';
import {FormContext} from '../../FormContext';
import {FormItemSet} from './FormItemSet';
import {FormItemSetOccurrenceView} from './FormItemSetOccurrenceView';
import {FormSetOccurrences} from '../FormSetOccurrences';
import {FormItemOccurrencesConfig} from '../../FormItemOccurrences';
import {FormSetOccurrence} from '../FormSetOccurrence';
import {RemoveButtonClickedEvent} from '../../RemoveButtonClickedEvent';
import {CreatedFormItemLayerConfig, FormItemLayerFactory} from '../../FormItemLayerFactory';

export interface FormItemSetOccurrencesConfig {

    layerFactory: FormItemLayerFactory;

    context: FormContext;

    occurrenceViewContainer: Element;

    formItemSet: FormItemSet;

    parent: FormItemSetOccurrenceView;

    propertyArray: PropertyArray;

    lazyRender?: boolean;
}

/*
 * A kind of a controller, which adds/removes FormItemSetOccurrenceView-s
 */
export class FormItemSetOccurrences
    extends FormSetOccurrences<FormItemSetOccurrenceView> {

    private lazyRender: boolean;

    protected layerFactory: FormItemLayerFactory;

    constructor(config: FormItemSetOccurrencesConfig) {
        super(<FormItemOccurrencesConfig>{
            formItem: config.formItemSet,
            propertyArray: config.propertyArray,
            occurrenceViewContainer: config.occurrenceViewContainer,
            allowedOccurrences: config.formItemSet.getOccurrences()
        });

        this.context = config.context;
        this.layerFactory = config.layerFactory;
        this.formSet = config.formItemSet;
        this.parent = config.parent;
        this.occurrencesCollapsed = false;
        this.lazyRender = config.lazyRender;
    }

    createNewOccurrenceView(occurrence: FormSetOccurrence<FormItemSetOccurrenceView>): FormItemSetOccurrenceView {

        const dataSet = this.getSetFromArray(occurrence);
        const layerConfig: CreatedFormItemLayerConfig = {context: this.context, lazyRender: this.lazyRender};

        const newOccurrenceView = new FormItemSetOccurrenceView({
            context: this.context,
            layer: this.layerFactory.createLayer(layerConfig),
            formSetOccurrence: occurrence,
            formItemSet: <FormItemSet> this.formSet,
            parent: this.parent,
            dataSet: dataSet
        });

        newOccurrenceView.onRemoveButtonClicked((event: RemoveButtonClickedEvent<FormItemSetOccurrenceView>) => {
            this.removeOccurrenceView(event.getView());
        });

        return newOccurrenceView;
    }
}
