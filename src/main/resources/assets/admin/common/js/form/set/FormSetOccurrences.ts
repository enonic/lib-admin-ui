import * as Q from 'q';
import {PropertySet} from '../../data/PropertySet';
import {PropertyArray} from '../../data/PropertyArray';
import {FormSetOccurrenceView, FormSetOccurrenceViewConfig} from './FormSetOccurrenceView';
import {FormItemOccurrences} from '../FormItemOccurrences';
import {FormContext} from '../FormContext';
import {FormSet} from './FormSet';
import {Occurrences} from '../Occurrences';
import {FormItemOccurrence} from '../FormItemOccurrence';
import {FormSetOccurrence} from './FormSetOccurrence';
import {FormItemLayerFactory} from '../FormItemLayerFactory';
import {Element} from '../../dom/Element';
import {RemoveButtonClickedEvent} from '../RemoveButtonClickedEvent';
import {FormItemLayer} from '../FormItemLayer';
import {FormItemState} from '../FormItemState';

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

    private readonly parent: FormSetOccurrenceView;

    private readonly formSet: FormSet;

    private readonly lazyRender: boolean;

    private layerFactory: FormItemLayerFactory;

    private expandRequestedListeners: ((view: FormSetOccurrenceView) => void)[] = [];

    protected readonly context: FormContext;

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
        this.lazyRender = config.lazyRender;
    }

    protected getNewOccurrenceConfig(occurrence: FormSetOccurrence<V>, state: FormItemState): FormSetOccurrenceViewConfig<V> {
        const dataSet: PropertySet = this.getOrPopulateSetFromArray(occurrence.getIndex());
        const layer: FormItemLayer =
            this.layerFactory.createLayer({context: this.context, lazyRender: this.lazyRender, formItemState: state});

        return {
            context: this.context,
            layer: layer,
            formSetOccurrence: occurrence,
            formSet: this.formSet,
            parent: this.parent,
            dataSet: dataSet
        };
    }

    protected addOccurrenceView(occurrence: FormItemOccurrence<V>, validate: boolean = true, state: FormItemState): V {
        if (occurrence.getIndex() < this.countOccurrences()) {
            // we're adding to the middle of array, add set and then move it to necessary index
            this.propertyArray.addSet();
            this.propertyArray.move(this.propertyArray.getSize() - 1, occurrence.getIndex());
        }
        return super.addOccurrenceView(occurrence, validate, state);
    }

    createOccurrenceView(occurrence: FormSetOccurrence<V>, state: FormItemState): V {
        const occurrenceView: V = this.createFormSetOccurrenceView(this.getNewOccurrenceConfig(occurrence, state));

        occurrenceView.onRemoveButtonClicked((event: RemoveButtonClickedEvent<V>) => this.removeOccurrenceView(event.getView()));
        occurrenceView.onExpandRequested(view => this.notifyExpandRequested(view));

        return occurrenceView;
    }

    protected createFormSetOccurrenceView(_config: FormSetOccurrenceViewConfig<V>): V {
        throw new Error('Must be implemented by inheritor');
    }

    showOccurrences(show: boolean, skipInvalid?: boolean) {
        const views = this.getOccurrenceViews();
        views.forEach((formSetOccurrenceView: FormSetOccurrenceView) => {
            if (!skipInvalid || formSetOccurrenceView.isValid()) {
                formSetOccurrenceView.setContainerVisible(show);
            }
        });
    }

    getFormSet(): FormSet {
        return this.formSet;
    }

    getAllowedOccurrences(): Occurrences {
        return this.formSet.getOccurrences();
    }

    createOccurrence(formItemOccurrences: FormItemOccurrences<V>,
                     insertAtIndex: number): FormItemOccurrence<V> {
        return new FormSetOccurrence(formItemOccurrences as FormSetOccurrences<V>, insertAtIndex);
    }

    toggleHelpText(show?: boolean) {
        this.getOccurrenceViews().forEach((view) => {
            view.toggleHelpText(show);
        });
    }

    isCollapsed(): boolean {
        return this.getOccurrenceViews().every((formSetOccurrenceView: FormSetOccurrenceView) => {
            return !formSetOccurrenceView.isContainerVisible();
        });
    }

    moveOccurrence(index: number, destinationIndex: number) {
        super.moveOccurrence(index, destinationIndex);
    }

    updateOccurrenceView(occurrenceView: FormSetOccurrenceView, _unchangedOnly?: boolean): Q.Promise<void> {
        const propertySet: PropertySet = this.getOrPopulateSetFromArray(occurrenceView.getIndex());
        return occurrenceView.update(propertySet);
    }

    refreshOccurence(index: number) {
        this.occurrenceViews[index].refreshViews();
    }

    onExpandRequested(listener: (view: FormSetOccurrenceView) => void): void {
        this.expandRequestedListeners.push(listener);
    }

    unExpandRequested(listener: (view: FormSetOccurrenceView) => void): void {
        this.expandRequestedListeners.filter((currentListener: (view: FormSetOccurrenceView) => void) => {
            return currentListener !== listener;
        });
    }

    notifyExpandRequested(view: FormSetOccurrenceView) {
        this.expandRequestedListeners.forEach((listener: (view: FormSetOccurrenceView) => void) => listener(view));
    }

    private getOrPopulateSetFromArray(index: number): PropertySet {
        return this.propertyArray.getSet(index) || this.propertyArray.addSet();
    }

    protected showEmptyFormItemOccurrences(): boolean {
        return this.context.getShowEmptyFormItemSetOccurrences();
    }
}
