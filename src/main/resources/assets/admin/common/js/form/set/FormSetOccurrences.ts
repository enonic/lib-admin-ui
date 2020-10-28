import * as Q from 'q';
import {PropertySet} from '../../data/PropertySet';
import {Property} from '../../data/Property';
import {PropertyArray} from '../../data/PropertyArray';
import {FormSetOccurrenceView, FormSetOccurrenceViewConfig} from './FormSetOccurrenceView';
import {FormItemOccurrences} from '../FormItemOccurrences';
import {FormContext} from '../FormContext';
import {FormSet} from './FormSet';
import {OccurrenceRenderedEvent} from '../OccurrenceRenderedEvent';
import {Occurrences} from '../Occurrences';
import {FormItemOccurrence} from '../FormItemOccurrence';
import {FormSetOccurrence} from './FormSetOccurrence';
import {FormItemLayerFactory} from '../FormItemLayerFactory';
import {Element} from '../../dom/Element';

export interface FormSetOccurrencesConfig<V extends FormSetOccurrenceView> {

    layerFactory: FormItemLayerFactory;

    context: FormContext;

    occurrenceViewContainer: Element;

    formSet: FormSet;

    parent: V;

    propertyArray: PropertyArray;

    lazyRender?: boolean;
}

export class FormSetOccurrences<V extends FormSetOccurrenceView>
    extends FormItemOccurrences<V> {

    private context: FormContext;

    private parent: FormSetOccurrenceView;

    private occurrencesCollapsed: boolean = false;

    private formSet: FormSet;

    private lazyRender: boolean;

    private layerFactory: FormItemLayerFactory;

    constructor(config: FormSetOccurrencesConfig<V>) {
        super({
            formItem: config.formSet,
            propertyArray: config.propertyArray,
            occurrenceViewContainer: config.occurrenceViewContainer,
            allowedOccurrences: config.formSet.getOccurrences()
        });

        this.context = config.context;
        this.layerFactory = config.layerFactory;
        this.formSet = config.formSet;
        this.parent = config.parent;
        this.occurrencesCollapsed = false;
        this.lazyRender = config.lazyRender;

        this.onOccurrenceRendered((event: OccurrenceRenderedEvent) => {
            const occurrenceView = <FormSetOccurrenceView>event.getOccurrenceView();
            occurrenceView.getContainer().onShown(() => this.updateOccurrencesCollapsed());
            occurrenceView.getContainer().onHidden(() => this.updateOccurrencesCollapsed());
        });
    }

    protected getNewOccurrenceConfig(occurrence: FormSetOccurrence<V>): FormSetOccurrenceViewConfig<V> {
        const dataSet = this.getSetFromArray(occurrence);
        const layer = this.layerFactory.createLayer({context: this.context, lazyRender: this.lazyRender});

        return {
            context: this.context,
            layer: layer,
            formSetOccurrence: occurrence,
            formSet: this.formSet,
            parent: this.parent,
            dataSet: dataSet
        }
    }
/*
    createNewOccurrenceView(occurrence: FormSetOccurrence<V>): V {

        let dataSet = this.getSetFromArray(occurrence);

        let newOccurrenceView = V.constructor(<FormOptionSetOccurrenceViewConfig>{
            context: this.context,
            layer: this.layerFactory.createLayer({context: this.context, lazyRender: this.lazyRender}),
            formSetOccurrence: occurrence,
            formOptionSet: <FormOptionSet> this.formSet,
            parent: this.parent,
            dataSet: dataSet
        });

        newOccurrenceView.onRemoveButtonClicked((event: RemoveButtonClickedEvent<FormSetOccurrenceView>) => {
            this.removeOccurrenceView(event.getView());
        });
        return newOccurrenceView;
    }
*/
    showOccurrences(show: boolean) {
        let views = this.getOccurrenceViews();
        this.occurrencesCollapsed = !show;
        views.forEach((formSetOccurrenceView: FormSetOccurrenceView) => {
            formSetOccurrenceView.showContainer(show);
        });
    }

    getFormSet(): FormSet {
        return this.formSet;
    }

    getAllowedOccurrences(): Occurrences {
        return this.formSet.getOccurrences();
    }

    createNewOccurrence(formItemOccurrences: FormItemOccurrences<V>,
                        insertAtIndex: number): FormItemOccurrence<V> {
        this.occurrencesCollapsed = false;
        return new FormSetOccurrence(<FormSetOccurrences<V>>formItemOccurrences, insertAtIndex);
    }

    toggleHelpText(show?: boolean) {
        this.getOccurrenceViews().forEach((view) => {
            view.toggleHelpText(show);
        });
    }

    isCollapsed(): boolean {
        return this.occurrencesCollapsed;
    }

    moveOccurrence(index: number, destinationIndex: number) {
        super.moveOccurrence(index, destinationIndex);
    }

    updateOccurrenceView(occurrenceView: FormSetOccurrenceView, propertyArray: PropertyArray,
                         _unchangedOnly?: boolean): Q.Promise<void> {
        this.propertyArray = propertyArray;

        return occurrenceView.update(propertyArray);
    }

    resetOccurrenceView(occurrenceView: FormSetOccurrenceView) {
        occurrenceView.reset();
    }

    refreshOccurence(index: number) {
        this.occurrenceViews[index].refreshViews();
    }

    update(propertyArray: PropertyArray, unchangedOnly?: boolean): Q.Promise<void> {
        if (propertyArray.isEmpty()) {
            return this.updateNoData(propertyArray, unchangedOnly);
        } else {
            return super.update(propertyArray, unchangedOnly);
        }
    }

    protected getSetFromArray(occurrence: FormItemOccurrence<V>): PropertySet {
        let dataSet = this.propertyArray.getSet(occurrence.getIndex());
        if (!dataSet) {
            dataSet = this.propertyArray.addSet();
        }
        return dataSet;
    }

    protected constructOccurrencesForNoData(): FormItemOccurrence<V>[] {
        let occurrences: FormItemOccurrence<V>[] = [];
        let minimumOccurrences = this.getAllowedOccurrences().getMinimum();

        if (minimumOccurrences > 0) {
            for (let i = 0; i < minimumOccurrences; i++) {
                occurrences.push(this.createNewOccurrence(this, i));
            }
        } else if (this.context.getShowEmptyFormItemSetOccurrences()) {
            occurrences.push(this.createNewOccurrence(this, 0));
        }

        return occurrences;
    }

    protected constructOccurrencesForData(): FormItemOccurrence<V>[] {
        let occurrences: FormItemOccurrence<V>[] = [];

        this.propertyArray.forEach((_property: Property, index: number) => {
            occurrences.push(this.createNewOccurrence(this, index));
        });

        if (occurrences.length < this.getAllowedOccurrences().getMinimum()) {
            for (let index: number = occurrences.length; index < this.getAllowedOccurrences().getMinimum(); index++) {
                occurrences.push(this.createNewOccurrence(this, index));
            }
        }
        return occurrences;
    }

    private updateOccurrencesCollapsed() {
        this.occurrencesCollapsed = this.getOccurrenceViews().every((formSetOccurrenceView: FormSetOccurrenceView) => {
            return !formSetOccurrenceView.isContainerVisible();
        });
    }

    private updateNoData(propertyArray: PropertyArray, unchangedOnly?: boolean): Q.Promise<void> {
        const promises: Q.Promise<void>[] = [];
        const occurrencesViewClone: V[] = [].concat(this.occurrenceViews);
        const occurrencesNoDataSize: number = this.constructOccurrencesForNoData().length;

        for (let i = 0; i < occurrencesNoDataSize; i++) {
            promises.push(this.updateOccurrenceView(occurrencesViewClone[i], propertyArray, unchangedOnly));
        }

        for (let i = occurrencesNoDataSize; i < occurrencesViewClone.length; i++) {
            this.removeOccurrenceView(occurrencesViewClone[i]);
        }

        this.propertyArray = propertyArray;

        return Q.all(promises).spread<void>(() => Q<void>(null));
    }
}
