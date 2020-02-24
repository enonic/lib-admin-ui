import {PropertyArray} from '../../../data/PropertyArray';
import {Element} from '../../../dom/Element';
import {FormContext} from '../../FormContext';
import {FormOptionSet} from './FormOptionSet';
import {FormOptionSetOccurrenceView, FormOptionSetOccurrenceViewConfig} from './FormOptionSetOccurrenceView';
import {FormSetOccurrences} from '../FormSetOccurrences';
import {FormItemOccurrencesConfig} from '../../FormItemOccurrences';
import {FormSetOccurrence} from '../FormSetOccurrence';
import {RemoveButtonClickedEvent} from '../../RemoveButtonClickedEvent';
import {FormItemLayerFactory} from '../../FormItemLayerFactory';

export interface FormOptionSetOccurrencesConfig {

    layerFactory: FormItemLayerFactory;

    context: FormContext;

    occurrenceViewContainer: Element;

    formOptionSet: FormOptionSet;

    parent: FormOptionSetOccurrenceView;

    propertyArray: PropertyArray;

    lazyRender?: boolean;
}

export class FormOptionSetOccurrences
    extends FormSetOccurrences<FormOptionSetOccurrenceView> {

    private lazyRender: boolean;

    protected layerFactory: FormItemLayerFactory;

    constructor(config: FormOptionSetOccurrencesConfig) {
        super(<FormItemOccurrencesConfig>{
            formItem: config.formOptionSet,
            propertyArray: config.propertyArray,
            occurrenceViewContainer: config.occurrenceViewContainer,
            allowedOccurrences: config.formOptionSet.getOccurrences()
        });

        this.layerFactory = config.layerFactory;
        this.context = config.context;
        this.formSet = config.formOptionSet;
        this.parent = config.parent;
        this.lazyRender = config.lazyRender;
        this.occurrencesCollapsed = false;
    }

    createNewOccurrenceView(occurrence: FormSetOccurrence<FormOptionSetOccurrenceView>): FormOptionSetOccurrenceView {

        let dataSet = this.getSetFromArray(occurrence);

        let newOccurrenceView = new FormOptionSetOccurrenceView(<FormOptionSetOccurrenceViewConfig>{
            context: this.context,
            layer: this.layerFactory.createLayer({context: this.context, lazyRender: this.lazyRender}),
            formSetOccurrence: occurrence,
            formOptionSet: <FormOptionSet> this.formSet,
            parent: this.parent,
            dataSet: dataSet
        });

        newOccurrenceView.onRemoveButtonClicked((event: RemoveButtonClickedEvent<FormOptionSetOccurrenceView>) => {
            this.removeOccurrenceView(event.getView());
        });
        return newOccurrenceView;
    }
}
