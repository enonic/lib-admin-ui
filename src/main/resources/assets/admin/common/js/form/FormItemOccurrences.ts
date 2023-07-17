import * as Q from 'q';
import {PropertyArray} from '../data/PropertyArray';
import {Element} from '../dom/Element';
import {Property} from '../data/Property';
import {DefaultErrorHandler} from '../DefaultErrorHandler';
import {ArrayHelper} from '../util/ArrayHelper';
import {FormItem} from './FormItem';
import {Occurrences} from './Occurrences';
import {FormItemOccurrenceView} from './FormItemOccurrenceView';
import {FormItemOccurrence} from './FormItemOccurrence';
import {OccurrenceAddedEvent} from './OccurrenceAddedEvent';
import {OccurrenceRenderedEvent} from './OccurrenceRenderedEvent';
import {OccurrenceRemovedEvent} from './OccurrenceRemovedEvent';
import {FormItemState} from './FormItemState';

export interface FormItemOccurrencesConfig {

    formItem: FormItem;

    propertyArray: PropertyArray;

    occurrenceViewContainer: Element;

    allowedOccurrences?: Occurrences;

}

export class FormItemOccurrences<V extends FormItemOccurrenceView> {

    public static debug: boolean = false;
    protected occurrenceViews: V[] = [];
    protected propertyArray: PropertyArray;
    private occurrences: FormItemOccurrence<V>[] = [];
    private occurrenceViewContainer: Element;
    private formItem: FormItem;
    private allowedOccurrences: Occurrences;
    private occurrenceAddedListeners: ((event: OccurrenceAddedEvent) => void)[] = [];
    private occurrenceRenderedListeners: ((event: OccurrenceRenderedEvent) => void)[] = [];
    private occurrenceRemovedListeners: ((event: OccurrenceRemovedEvent) => void)[] = [];
    private occurrenceChangedListeners: ((view: FormItemOccurrenceView) => void)[] = [];
    private focusListeners: ((event: FocusEvent) => void)[] = [];
    private blurListeners: ((event: FocusEvent) => void)[] = [];
    private focusListener: (event: FocusEvent) => void;
    private blurListener: (event: FocusEvent) => void;
    private occurrenceChangedListener: (view: FormItemOccurrenceView) => void;

    constructor(config: FormItemOccurrencesConfig) {
        this.formItem = config.formItem;
        this.propertyArray = config.propertyArray;
        this.occurrenceViewContainer = config.occurrenceViewContainer;
        this.allowedOccurrences = config.allowedOccurrences;

        this.focusListener = (event: FocusEvent) => this.notifyFocused(event);
        this.blurListener = (event: FocusEvent) => this.notifyBlurred(event);
        this.occurrenceChangedListener = ((view) => this.notifyOccurrenceChanged(view));
    }

    hasHelpText(): boolean {
        return this.getOccurrenceViews().some((view) => view.hasHelpText());
    }

    getAllowedOccurrences(): Occurrences {
        throw new Error('Must be implemented by inheritor');
    }

    onOccurrenceRendered(listener: (event: OccurrenceRenderedEvent) => void) {
        this.occurrenceRenderedListeners.push(listener);
    }

    refreshOccurence(_index: number) {
        //to be implemented on demand in inheritors
    }

    unOccurrenceRendered(listener: (event: OccurrenceRenderedEvent) => void) {
        this.occurrenceRenderedListeners =
            this.occurrenceRenderedListeners.filter((currentListener: (event: OccurrenceRenderedEvent) => void) => {
                return listener !== currentListener;
            });
    }

    onOccurrenceAdded(listener: (event: OccurrenceAddedEvent) => void) {
        this.occurrenceAddedListeners.push(listener);
    }

    unOccurrenceAdded(listener: (event: OccurrenceAddedEvent) => void) {
        this.occurrenceAddedListeners = this.occurrenceAddedListeners.filter((currentListener: (event: OccurrenceAddedEvent) => void) => {
            return listener !== currentListener;
        });
    }

    onOccurrenceRemoved(listener: (event: OccurrenceRemovedEvent) => void) {
        this.occurrenceRemovedListeners.push(listener);
    }

    unOccurrenceRemoved(listener: (event: OccurrenceRemovedEvent) => void) {
        this.occurrenceRemovedListeners =
            this.occurrenceRemovedListeners.filter((currentListener: (event: OccurrenceRemovedEvent) => void) => {
                return listener !== currentListener;
            });
    }

    onOccurrenceChanged(listener: (view: FormItemOccurrenceView) => void) {
        this.occurrenceChangedListeners.push(listener);
    }

    unOccurrenceChanged(listener: (view: FormItemOccurrenceView) => void) {
        this.occurrenceChangedListeners =
            this.occurrenceChangedListeners.filter((currentListener: (event: FormItemOccurrenceView) => void) => {
                return listener !== currentListener;
            });
    }

    private notifyOccurrenceChanged(view: FormItemOccurrenceView): void {
        this.occurrenceChangedListeners.forEach((listener) => listener(view));
    }

    getFormItem(): FormItem {
        return this.formItem;
    }

    maximumOccurrencesReached(): boolean {
        return this.allowedOccurrences.maximumReached(this.countOccurrences());
    }

    layout(validate: boolean = true): Q.Promise<void> {
        const occurrences: FormItemOccurrence<V>[] = this.constructOccurrences();

        return this.layoutOccurrences(occurrences, validate, FormItemState.EXISTING);
    }

    update(propertyArray: PropertyArray, unchangedOnly?: boolean): Q.Promise<void> {
        if (FormItemOccurrences.debug) {
            console.debug('FormItemOccurrences.update:', propertyArray);
        }

        this.propertyArray = propertyArray;

        return this.updateExistingOccurrences(unchangedOnly);
    }

    reset() {
        this.propertyArray.forEach((_property: Property, i: number) => {
            let occurrenceView = this.occurrenceViews[i];
            let occurrence = this.occurrences[i];
            if (occurrenceView && occurrence) {
                this.resetOccurrenceView(occurrenceView);
            }
        });
    }

    clean(): void {
        this.occurrenceViews.forEach((view: V) => view.clean());
    }

    clear(): void {
        this.occurrenceViews.forEach((view: V) => view.clear());
    }

    setEnabled(enable: boolean) {
        this.occurrenceViews.forEach((view: V) => {
            view.setEnabled(enable);
        });
    }

    createOccurrenceView(_occurrence: FormItemOccurrence<V>, state: FormItemState): V {
        throw new Error('Must be implemented by inheritor');
    }

    updateOccurrenceView(_occurrenceView: V, _unchangedOnly?: boolean): Q.Promise<void> {
        throw new Error('Must be implemented by inheritor');
    }

    resetOccurrenceView(_occurrenceView: V) {
        _occurrenceView.reset();
    }

    createOccurrence(_formItemOccurrences: FormItemOccurrences<V>, _insertAtIndex: number): FormItemOccurrence<V> {
        throw new Error('Must be implemented by inheritor');
    }

    public addNewOccurrence(insertAtIndex: number = this.countOccurrences(), validate: boolean = true): Q.Promise<V> {
        const occurrence: FormItemOccurrence<V> = this.createOccurrence(this, insertAtIndex);
        const occurrenceView: V = this.addOccurrenceView(occurrence, validate, FormItemState.NEW);
        this.notifyOccurrenceAdded(occurrence, occurrenceView);

        return this.layoutOccurrence(occurrence, occurrenceView, validate).then(() => {
            // hiding validation error on adding new items until validate() is invoked
            occurrenceView.addClass('hide-validation-errors');
            return occurrenceView;
        });
    }

    onFocus(listener: (event: FocusEvent) => void) {
        this.focusListeners.push(listener);
    }

    unFocus(listener: (event: FocusEvent) => void) {
        this.focusListeners = this.focusListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    onBlur(listener: (event: FocusEvent) => void) {
        this.blurListeners.push(listener);
    }

    unBlur(listener: (event: FocusEvent) => void) {
        this.blurListeners = this.blurListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    resetOccurrenceIndexes() {
        this.occurrences.forEach((currOccurrence: FormItemOccurrence<V>, index: number) => {
            currOccurrence.setIndex(index);
        });
    }

    refreshOccurrenceViews() {
        this.occurrenceViews.forEach((currOccurrenceView: V) => {
            currOccurrenceView.refresh();
        });
    }

    hasNonDefaultValues(): boolean {
        return this.occurrenceViews.some((currOccurrenceView: V) => currOccurrenceView.hasNonDefaultValues());
    }

    isEmpty(): boolean {
        return this.occurrenceViews.every((currOccurrenceView: V) => currOccurrenceView.isEmpty());
    }

    isExpandable(): boolean {
        return this.occurrenceViews.some((view: V) => view.isExpandable());
    }

    getOccurrenceViewElementBefore(index: number): V {
        if (index < 1) {
            return null;
        }
        return this.occurrenceViews.filter((occurrenceView: V) => {
            return occurrenceView.getIndex() === index - 1;
        })[0];
    }

    countOccurrences(): number {
        return this.occurrences.length;
    }

    moveOccurrence(fromIndex: number, toIndex: number) {

        // move FormItemSetOccurrence
        ArrayHelper.moveElement(fromIndex, toIndex, this.occurrences);
        // update FormItemSetOccurrence indexes
        this.occurrences.forEach((occurrence: FormItemOccurrence<V>, index: number) => {
            occurrence.setIndex(index);
        });

        // move FormItemOccurrenceView
        ArrayHelper.moveElement(fromIndex, toIndex, this.occurrenceViews);

        this.propertyArray.move(fromIndex, toIndex);

    }

    getOccurrences(): FormItemOccurrence<V>[] {
        return this.occurrences;
    }

    getOccurrenceViews(): V[] {
        return this.occurrenceViews;
    }

    protected showEmptyFormItemOccurrences(): boolean {
        return true;
    }

    private getTotalOccurrencesNeeded(): number {
        const minimumOccurrences: number = this.getAllowedOccurrences().getMinimum();

        if (this.propertyArray.getSize() > 0) {
            return Math.max(this.propertyArray.getSize(), minimumOccurrences);
        }

        if (minimumOccurrences > 0) {
            return minimumOccurrences;
        }

        return this.showEmptyFormItemOccurrences() ? 1 : 0;
    }

    protected addOccurrenceView(occurrence: FormItemOccurrence<V>, validate: boolean = true, state: FormItemState): V {
        if (FormItemOccurrences.debug) {
            console.debug('FormItemOccurrences.addOccurrence:', occurrence);
        }

        const countOccurrences: number = this.countOccurrences();

        if (this.allowedOccurrences.maximumReached(countOccurrences)) {
            return null;
        }

        const occurrenceView: V = this.createOccurrenceView(occurrence, state);
        occurrenceView.onFocus(this.focusListener);
        occurrenceView.onBlur(this.blurListener);
        occurrenceView.onOccurrenceChanged(this.occurrenceChangedListener);

        let insertAtIndex: number = occurrence.getIndex();
        this.occurrences.splice(insertAtIndex, 0, occurrence);
        if (insertAtIndex === 0) {
            this.occurrenceViewContainer.prependChild(occurrenceView);
        } else {
            let occurrenceViewBefore: Element = this.getOccurrenceViewElementBefore(insertAtIndex);
            if (insertAtIndex === countOccurrences || !occurrenceViewBefore) {
                this.occurrenceViewContainer.appendChild(occurrenceView);
            } else {
                occurrenceView.insertAfterEl(occurrenceViewBefore);
            }
        }

        this.occurrenceViews.splice(insertAtIndex, 0, occurrenceView);

        return occurrenceView;
    }

    protected layoutOccurrence(occurrence: FormItemOccurrence<V>, occurrenceView: V, validate: boolean = true): Q.Promise<void> {
        return occurrenceView.layout(validate).then(() => {
            this.resetOccurrenceIndexes();
            this.refreshOccurrenceViews();
            occurrenceView.giveFocus();
            this.notifyOccurrenceRendered(occurrence, occurrenceView, validate);
            return Q.resolve();
        }).catch((reason) => {
            DefaultErrorHandler.handle(reason);
            return null;
        });
    }

    protected removeOccurrenceView(occurrenceViewToRemove: V) {
        if (FormItemOccurrences.debug) {
            console.debug('FormItemOccurrences.removeOccurrenceView:', occurrenceViewToRemove);
        }

        const indexToRemove: number = occurrenceViewToRemove.getIndex();

        occurrenceViewToRemove.unFocus(this.focusListener);
        occurrenceViewToRemove.unBlur(this.blurListener);
        occurrenceViewToRemove.unOccurrenceChanged(this.occurrenceChangedListener);

        occurrenceViewToRemove.remove();
        this.occurrenceViews = this.occurrenceViews.filter((curr: V) => {
            return curr !== occurrenceViewToRemove;
        });
        let occurrenceToRemove = this.occurrences[indexToRemove];
        this.occurrences = this.occurrences.filter((curr: FormItemOccurrence<V>) => {
            return curr.getIndex() !== indexToRemove;
        });

        this.resetOccurrenceIndexes();
        this.refreshOccurrenceViews();

        if (this.propertyArray.get(indexToRemove)) { // if not already removed
            this.propertyArray.remove(indexToRemove);
        }

        this.notifyOccurrenceRemoved(occurrenceToRemove, occurrenceViewToRemove);
    }

    private notifyOccurrenceRendered(occurrence: FormItemOccurrence<V>, occurrenceView: V, validate: boolean) {
        this.occurrenceRenderedListeners.forEach((listener: (event: OccurrenceRenderedEvent) => void) => {
            listener.call(this, new OccurrenceRenderedEvent(occurrence, occurrenceView, validate));
        });
    }

    private notifyOccurrenceAdded(occurrence: FormItemOccurrence<V>, occurrenceView: V) {
        this.occurrenceAddedListeners.forEach((listener: (event: OccurrenceAddedEvent) => void) => {
            listener.call(this, new OccurrenceAddedEvent(occurrence, occurrenceView));
        });
    }

    private notifyOccurrenceRemoved(occurrence: FormItemOccurrence<V>, occurrenceView: V) {
        this.occurrenceRemovedListeners.forEach((listener: (event: OccurrenceRemovedEvent) => void) => {
            listener.call(this, new OccurrenceRemovedEvent(occurrence, occurrenceView));
        });
    }

    private constructOccurrences(): FormItemOccurrence<V>[] {
        const occurrences: FormItemOccurrence<V>[] = [];
        const totalItemsToCreate: number = this.getTotalOccurrencesNeeded();

        for (let index: number = 0; index < totalItemsToCreate; index++) {
            occurrences.push(this.createOccurrence(this, index));
        }

        return occurrences;
    }

    private layoutOccurrences(occurrences: FormItemOccurrence<V>[], validate: boolean, state: FormItemState): Q.Promise<void> {
        const layoutPromises: Q.Promise<void>[] = [];

        occurrences.forEach((occurrence: FormItemOccurrence<V>) => {
            const occurrenceView: V = this.addOccurrenceView(occurrence, validate, state);
            this.notifyOccurrenceAdded(occurrence, occurrenceView);

            if (occurrenceView) {
                layoutPromises.push(this.layoutOccurrence(occurrence, occurrenceView, validate));
            }
        });

        return Q.all(layoutPromises).spread<void>(() => Q<void>(null));
    }

    private updateExistingOccurrences(unchangedOnly?: boolean): Q.Promise<void> {
        const promises: Q.Promise<any>[] = [];
        const totalItemsNeeded: number = this.getTotalOccurrencesNeeded();

        const extraItemsToRemove: V[] = this.occurrenceViews.filter((item: V, index: number) => index >= totalItemsNeeded);
        extraItemsToRemove.forEach((item: V) => this.removeOccurrenceView(item));

        this.occurrenceViews.forEach((view: V) => {
            promises.push(this.updateOccurrenceView(view, unchangedOnly));
        });

        while (this.occurrenceViews.length < totalItemsNeeded) {
            promises.push(this.addNewOccurrence());
        }

        return Q.all(promises).spread<void>(() => Q<void>(null));
    }

    private notifyFocused(event: FocusEvent) {
        this.focusListeners.forEach((listener) => {
            listener(event);
        });
    }

    private notifyBlurred(event: FocusEvent) {
        this.blurListeners.forEach((listener) => {
            listener(event);
        });
    }
}
