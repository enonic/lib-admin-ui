import * as $ from 'jquery';
import * as Q from 'q';
import {PropertySet} from '../../data/PropertySet';
import {PropertyArray} from '../../data/PropertyArray';
import {DragHelper} from '../../ui/DragHelper';
import {ValueTypes} from '../../data/ValueTypes';
import {i18n} from '../../util/Messages';
import {DivEl} from '../../dom/DivEl';
import {Button} from '../../ui/button/Button';
import {AEl} from '../../dom/AEl';
import {ObjectHelper} from '../../ObjectHelper';
import {Element} from '../../dom/Element';
import {Occurrences} from '../Occurrences';
import {FormSetOccurrenceView} from './FormSetOccurrenceView';
import {FormItemView} from '../FormItemView';
import {RecordingValidityChangedEvent} from '../RecordingValidityChangedEvent';
import {ValidationRecording} from '../ValidationRecording';
import {FormSetOccurrences, FormSetOccurrencesConfig} from './FormSetOccurrences';
import {FormSet} from './FormSet';
import {FormItemOccurrenceView} from '../FormItemOccurrenceView';
import {assert} from '../../util/Assert';
import {ValidationRecordingPath} from '../ValidationRecordingPath';
import {OccurrenceRenderedEvent} from '../OccurrenceRenderedEvent';
import {OccurrenceAddedEvent} from '../OccurrenceAddedEvent';
import {OccurrenceRemovedEvent} from '../OccurrenceRemovedEvent';
import {FormItemLayerFactory} from '../FormItemLayerFactory';
import {FormContext} from '../FormContext';
import {FormSetHeader} from './FormSetHeader';
import {FormOptionSetOptionView} from './optionset/FormOptionSetOptionView';

export interface FormSetViewConfig {

    layerFactory: FormItemLayerFactory;

    context: FormContext;

    parentDataSet: PropertySet;

    occurrencesLazyRender?: boolean;

    formSet: FormSet;

    parent: FormSetOccurrenceView;
}

export abstract class FormSetView<V extends FormSetOccurrenceView>
    extends FormItemView {

    protected parentDataSet: PropertySet;

    protected header: FormSetHeader;

    protected occurrenceViewsContainer: DivEl;

    protected bottomButtonRow: DivEl;

    protected addButton: Button;

    protected collapseButtons: AEl[] = [];

    protected validityChangedListeners: { (event: RecordingValidityChangedEvent): void }[] = [];

    protected previousValidationRecording: ValidationRecording;

    protected formItemOccurrences: FormSetOccurrences<V>;

    protected classPrefix: string = '';

    protected helpText: string;

    protected formSet: FormSet;

    protected layerFactory: FormItemLayerFactory;

    protected occurrencesLazyRender: boolean;

    /**
     * The index of child Data being dragged.
     */
    protected draggingIndex: number;

    protected constructor(config: FormSetViewConfig, classPrefix: string) {
        super({
            className: `${classPrefix}-view`,
            context: config.context,
            formItem: config.formSet,
            parent: config.parent
        });

        this.layerFactory = config.layerFactory;
        this.parentDataSet = config.parentDataSet;
        this.formSet = config.formSet;
        this.classPrefix = classPrefix;
        this.helpText = this.formSet.getHelpText();
        this.occurrencesLazyRender = config.occurrencesLazyRender;

        this.addClass(this.formSet.getPath().getElements().length % 2 ? 'even' : 'odd');
        if (this.formSet.getOccurrences().getMaximum() === 1) {
            this.addClass('max-1-occurrence');
        }
    }

    getParent(): V {
        return <V>this.parent;
    }

    protected createOccurrences(config: FormSetOccurrencesConfig<V>): FormSetOccurrences<V> {
        return new FormSetOccurrences<V>(config);
    }

    protected initOccurrences(): FormSetOccurrences<V> {
        this.formItemOccurrences = this.createOccurrences({
            context: this.getContext(),
            layerFactory: this.layerFactory,
            occurrenceViewContainer: this.occurrenceViewsContainer,
            formSet: this.formSet,
            parent: this.getParent(),
            propertyArray: this.getPropertyArray(this.parentDataSet),
            lazyRender: this.occurrencesLazyRender
        });

        return this.formItemOccurrences;
    }

    public layout(validate: boolean = true): Q.Promise<void> {
        const deferred = Q.defer<void>();

        this.occurrenceViewsContainer = new DivEl('occurrence-views-container');

        $(this.occurrenceViewsContainer.getHTMLElement()).sortable({
            revert: false,
            containment: this.getHTMLElement(),
            cursor: 'move',
            cursorAt: {left: 14, top: 14},
            distance: 20,
            tolerance: 'pointer',
            handle: '.drag-control',
            placeholder: this.classPrefix + '-drop-target-placeholder',
            cancel: '.input-type-view.ui-sortable', // Elements with this class will not trigger this sortable
            helper: () => DragHelper.get().getHTMLElement(),
            start: (_event: Event, ui: JQueryUI.SortableUIParams) => this.handleDnDStart(ui),
            update: (_event: Event, ui: JQueryUI.SortableUIParams) => this.handleDnDUpdate(ui),
            stop: (_event: Event, ui: JQueryUI.SortableUIParams) => this.handleDnDStop(ui)
        });

        const topCollapseButton = this.makeCollapseButton();
        const topButtonRow = new DivEl('top-button-row');
        topButtonRow.appendChild(topCollapseButton);
        this.appendChildren(topButtonRow, this.occurrenceViewsContainer);

        this.initOccurrences().layout(validate).then(() => {
            // formItemOccurrences should be ready to check for nested help text by hasHelpText
            this.header = new FormSetHeader(this.formSet, this.hasHelpText());
            this.header.onHelpTextToggled((show: boolean) => this.toggleHelpText(show));
            this.prependChild(this.header);

            this.subscribeFormSetOccurrencesOnEvents();

            this.toggleHelpText(this.formSet.isHelpTextOn());

            this.bottomButtonRow = new DivEl('bottom-button-row');
            this.appendChild(this.bottomButtonRow);

            this.addButton = this.makeAddButton();
            const bottomCollapseButton = this.makeCollapseButton();
            this.bottomButtonRow.appendChildren<Element>(this.addButton, bottomCollapseButton);

            this.refreshButtonsState();

            if (validate) {
                this.validate(true);
            }

            if (this.shouldExpandOccurrences()) {
                this.toggleOccurrencesVisibility(true);
            }

            deferred.resolve(null);
        });

        return deferred.promise;
    }

    private shouldExpandOccurrences(): boolean {
        if (this.getContext().getFormState().isNew()) {
            return true;
        }

        if (this.formItemOccurrences.getOccurrences().length === 1) {
            return true;
        }

        return false;
    }

    validate(silent: boolean = true, viewToSkipValidation: FormItemOccurrenceView = null): ValidationRecording {

        if (!this.formItemOccurrences) {
            throw new Error('Can\'t validate before layout is done');
        }

        const validationRecordingPath = this.resolveValidationRecordingPath();
        const wholeRecording = new ValidationRecording();
        const occurrenceViews = this.formItemOccurrences.getOccurrenceViews().filter(view => view !== viewToSkipValidation);
        let numberOfValids = 0;

        occurrenceViews.forEach((occurrenceView: FormSetOccurrenceView) => {
            let recordingForOccurrence = occurrenceView.validate(silent);
            if (recordingForOccurrence.isValid()) {
                numberOfValids++;
            }
            wholeRecording.flatten(recordingForOccurrence);
        });

        if (numberOfValids < this.getOccurrences().getMinimum()) {
            wholeRecording.breaksMinimumOccurrences(validationRecordingPath);
        }
        if (this.getOccurrences().maximumBreached(numberOfValids)) {
            wholeRecording.breaksMaximumOccurrences(validationRecordingPath);
        }

        if (!silent && wholeRecording.validityChanged(this.previousValidationRecording)) {
            const event = new RecordingValidityChangedEvent(wholeRecording, validationRecordingPath);
            event.setIncludeChildren(true);

            this.notifyValidityChanged(event);
        }

        // display only errors related to occurrences
        this.renderValidationErrors(wholeRecording);

        this.previousValidationRecording = wholeRecording;

        return wholeRecording;
    }

    refresh() {
        this.formItemOccurrences.refreshOccurrenceViews();
    }

    hasNonDefaultValues(): boolean {
        return this.formItemOccurrences.hasNonDefaultValues();
    }

    isEmpty(): boolean {
        return this.formItemOccurrences.isEmpty();
    }

    isExpandable(): boolean {
        return this.formItemOccurrences.isExpandable();
    }

    broadcastFormSizeChanged() {
        this.formItemOccurrences.getOccurrenceViews().forEach((occurrenceView: FormSetOccurrenceView) => {
            occurrenceView.getFormItemViews().forEach((formItemView: FormItemView) => {
                formItemView.broadcastFormSizeChanged();
            });
        });
    }

    update(propertySet: PropertySet, unchangedOnly?: boolean): Q.Promise<void> {
        this.parentDataSet = propertySet;
        const propertyArray = this.getPropertyArray(propertySet);
        return this.formItemOccurrences.update(propertyArray, unchangedOnly);
    }

    public displayValidationErrors(value: boolean) {
        this.formItemOccurrences.getOccurrenceViews().forEach((view: FormSetOccurrenceView) => {
            view.displayValidationErrors(value);
        });
    }

    public setHighlightOnValidityChange(highlight: boolean) {
        this.formItemOccurrences.getOccurrenceViews().forEach((view: FormSetOccurrenceView) => {
            view.setHighlightOnValidityChange(highlight);
        });
    }

    hasValidUserInput(): boolean {

        let result = true;
        this.formItemOccurrences.getOccurrenceViews().forEach((formItemOccurrenceView: FormItemOccurrenceView) => {
            if (!formItemOccurrenceView.hasValidUserInput()) {
                result = false;
            }
        });

        return result;
    }

    onValidityChanged(listener: (event: RecordingValidityChangedEvent) => void) {
        this.validityChangedListeners.push(listener);
    }

    unValidityChanged(listener: (event: RecordingValidityChangedEvent) => void) {
        this.validityChangedListeners.filter((currentListener: (event: RecordingValidityChangedEvent) => void) => {
            return listener === currentListener;
        });
    }

    toggleHelpText(show?: boolean) {
        this.formItemOccurrences.toggleHelpText(show);
        this.header.toggleHelpText(show);
    }

    hasHelpText(): boolean {
        return !!this.helpText || this.formItemOccurrences.hasHelpText();
    }

    giveFocus(): boolean {

        let focusGiven = false;
        if (this.formItemOccurrences.getOccurrenceViews().length > 0) {
            const views: FormItemOccurrenceView[] = this.formItemOccurrences.getOccurrenceViews();
            for (let i = 0; i < views.length; i++) {
                if (views[i].giveFocus()) {
                    focusGiven = true;
                    break;
                }
            }
        }
        return focusGiven;
    }

    clean() {
        super.clean();

        this.formItemOccurrences.clean();
    }

    reset() {
        this.formItemOccurrences.reset();
    }

    setEnabled(enable: boolean) {
        this.formItemOccurrences.setEnabled(enable);
        this.addButton.setEnabled(enable);
    }

    onFocus(listener: (event: FocusEvent) => void) {
        this.formItemOccurrences.onFocus(listener);
    }

    unFocus(listener: (event: FocusEvent) => void) {
        this.formItemOccurrences.unFocus(listener);
    }

    onBlur(listener: (event: FocusEvent) => void) {
        this.formItemOccurrences.onBlur(listener);
    }

    unBlur(listener: (event: FocusEvent) => void) {
        this.formItemOccurrences.unBlur(listener);
    }

    protected handleFormSetOccurrenceViewValidityChanged(event: RecordingValidityChangedEvent): void {
        if (!this.previousValidationRecording) {
            return; // skip handling if not previousValidationRecording is not set
        }

        const previousValidState: boolean = this.previousValidationRecording.isValid();

        if (event.isValid()) {
            this.previousValidationRecording.removeByPath(event.getOrigin(), true, event.isIncludeChildren());
        } else {
            this.previousValidationRecording.flatten(event.getRecording());
        }

        const validationRecordingPath: ValidationRecordingPath = this.resolveValidationRecordingPath();

        const occurrenceViews: V[] = this.formItemOccurrences.getOccurrenceViews();
        const occurrenceRecording: ValidationRecording = new ValidationRecording(); // validity state of occurrences

        let numberOfValids: number = 0;

        occurrenceViews.forEach((occurrenceView: FormSetOccurrenceView) => {
            const recordingForOccurrence: ValidationRecording = occurrenceView.getValidationRecording();

            if (recordingForOccurrence) {
                if (recordingForOccurrence.isValid()) {
                    numberOfValids++;
                } else {
                    occurrenceRecording.flatten(recordingForOccurrence);
                }
            }
        });

        // We ensure that previousValidationRecording is invalid both when: at least on of its occurrences is invalid
        // or number of occurrences breaks contract.

        if (numberOfValids < this.getOccurrences().getMinimum()) {
            this.previousValidationRecording.breaksMinimumOccurrences(validationRecordingPath);
        } else if (!occurrenceRecording.containsPathInBreaksMin(validationRecordingPath)) {
            this.previousValidationRecording.removeUnreachedMinimumOccurrencesByPath(validationRecordingPath, false);
        }

        if (this.getOccurrences().maximumBreached(numberOfValids)) {
            this.previousValidationRecording.breaksMaximumOccurrences(validationRecordingPath);
        } else if (!occurrenceRecording.containsPathInBreaksMax(validationRecordingPath)) {
            this.previousValidationRecording.removeBreachedMaximumOccurrencesByPath(validationRecordingPath, false);
        }

        this.renderValidationErrors(this.previousValidationRecording);

        if (previousValidState !== this.previousValidationRecording.isValid()) {
            this.notifyValidityChanged(new RecordingValidityChangedEvent(this.previousValidationRecording,
                validationRecordingPath).setIncludeChildren(true));
        }
    }

    protected getPropertyArray(propertySet: PropertySet): PropertyArray {
        let propertyArray = propertySet.getPropertyArray(this.formSet.getName());
        if (!propertyArray) {
            propertyArray = PropertyArray.create().setType(ValueTypes.DATA).setName(this.formSet.getName()).setParent(
                this.parentDataSet).build();
            propertySet.addPropertyArray(propertyArray);
        }
        return propertyArray;
    }

    protected notifyValidityChanged(event: RecordingValidityChangedEvent) {
        this.validityChangedListeners.forEach((listener: (event: RecordingValidityChangedEvent) => void) => {
            listener(event);
        });
    }

    protected renderValidationErrors(recording: ValidationRecording) {
        if (recording.isValid()) {
            this.removeClass('invalid');
            this.addClass('valid');
        } else {
            this.removeClass('valid');
            this.addClass('invalid');
        }
    }

    protected handleDnDStart(ui: JQueryUI.SortableUIParams): void {
        const draggedElement = Element.fromHtmlElement(ui.item[0]);
        assert(draggedElement.hasClass(this.classPrefix + '-occurrence-view'));
        this.draggingIndex = draggedElement.getSiblingIndex();

        DragHelper.get().setDropAllowed(true);
        ui.placeholder.text('Drop form item set here');
    }

    protected handleDnDUpdate(ui: JQueryUI.SortableUIParams) {
        if (this.draggingIndex >= 0) {
            const draggedElement = Element.fromHtmlElement(ui.item[0]);
            assert(draggedElement.hasClass(this.classPrefix + '-occurrence-view'));
            const draggedToIndex = draggedElement.getSiblingIndex();

            this.formItemOccurrences.moveOccurrence(this.draggingIndex, draggedToIndex);

            this.formItemOccurrences.refreshOccurence(draggedToIndex);
        }

        this.draggingIndex = -1;
    }

    protected handleDnDStop(ui: JQueryUI.SortableUIParams) {
        const isDraggedToNewPos: boolean = this.draggingIndex === -1;

        if (isDraggedToNewPos) {
            return; // everything is already have been handled in update
        }

        const draggedElement = Element.fromHtmlElement(ui.item[0]);
        assert(draggedElement.hasClass(this.classPrefix + '-occurrence-view'));
        const draggedToIndex = draggedElement.getSiblingIndex();
        this.formItemOccurrences.refreshOccurence(draggedToIndex);
    }

    protected getOccurrences(): Occurrences {
        return this.formSet.getOccurrences();
    }

    protected resolveValidationRecordingPath(): ValidationRecordingPath {
        return new ValidationRecordingPath(this.parentDataSet.getPropertyPath(), this.formSet.getName(),
            this.getOccurrences().getMinimum(), this.getOccurrences().getMaximum());
    }

    private subscribeFormSetOccurrencesOnEvents() {

        this.formItemOccurrences.onExpandRequested(view => this.expandOccurrenceView(view));

        this.formItemOccurrences.onOccurrenceChanged(view => this.refreshButtonsState());

        this.formItemOccurrences.onOccurrenceRendered((event: OccurrenceRenderedEvent) => {
            const occurrenceView = event.getOccurrenceView();

            this.validate(false, event.validateViewOnRender() ? null : occurrenceView);

            if (ObjectHelper.iFrameSafeInstanceOf(occurrenceView, FormSetOccurrenceView)) {
                this.onFormSetOccurrenceContainerVisibilityToggle((<FormSetOccurrenceView>occurrenceView).getContainer());
            }
        });

        this.formItemOccurrences.onOccurrenceAdded((event: OccurrenceAddedEvent) => {
            this.refreshButtonsState();
            $(this.occurrenceViewsContainer.getHTMLElement()).sortable('refresh');

            if (ObjectHelper.iFrameSafeInstanceOf(event.getOccurrenceView(), FormSetOccurrenceView)) {
                const addedFormSetOccurrenceView = <V>event.getOccurrenceView();
                addedFormSetOccurrenceView.onValidityChanged((addedEvent: RecordingValidityChangedEvent) => {
                    this.handleFormSetOccurrenceViewValidityChanged(addedEvent);
                });
            }
        });
        this.formItemOccurrences.onOccurrenceRemoved((event: OccurrenceRemovedEvent) => {

            this.refreshButtonsState();

            if (event.getOccurrenceView().hasClass('form-item-set-occurrence-view')) {
                // force validate, since FormItemSet might have become invalid
                this.validate(false);
            }
        });

        this.formItemOccurrences.getOccurrenceViews().forEach((formSetOccurrenceView: V) => {
            formSetOccurrenceView.onValidityChanged((event: RecordingValidityChangedEvent) => {
                this.handleFormSetOccurrenceViewValidityChanged(event);
            });
            if (ObjectHelper.iFrameSafeInstanceOf(formSetOccurrenceView, FormSetOccurrenceView)) {
                this.onFormSetOccurrenceContainerVisibilityToggle((<FormSetOccurrenceView>formSetOccurrenceView).getContainer());
            }
        });
    }

    private onFormSetOccurrenceContainerVisibilityToggle(container: DivEl) {
        container.onShown((event) => {
            if (container === event.getTarget()) {
                this.updateCollapseButtons();
            }
        });
        container.onHidden((event) => {
            if (container === event.getTarget()) {
                this.updateCollapseButtons();
            }
        });
    }

    private updateCollapseButtons() {
        const views = this.formItemOccurrences.getOccurrenceViews();
        const occurrenceCount = views.length;
        const anyExpandable = occurrenceCount > 0 && views.some(view => view.isExpandable());
        const isCollapsed = (this.formItemOccurrences).isCollapsed();

        const caption = occurrenceCount > 1 ?
                        (isCollapsed ? i18n('button.expandall') : i18n('button.collapseall')) :
                        (isCollapsed ? i18n('button.expand') : i18n('button.collapse'));

        this.collapseButtons.forEach(b => b.setHtml(caption).setVisible(anyExpandable));
    }

    private makeCollapseButton(): AEl {
        const collapseButton = new AEl('collapse-button');
        collapseButton.onClicked((event: MouseEvent) => {
            const isCollapsed = (this.formItemOccurrences).isCollapsed();
            this.toggleOccurrencesVisibility(isCollapsed);
            return false;
        });
        this.collapseButtons.push(collapseButton);
        return collapseButton;
    }

    toggleOccurrencesVisibility(value: boolean, skipInvalid?: boolean) {
        this.formItemOccurrences.showOccurrences(value, skipInvalid);
        this.updateCollapseButtons();
    }

    private makeAddButton(): Button {
        const addButton: Button = new Button(i18n('action.add'));
        addButton
            .setTitle(i18n('button.add', this.formSet.getLabel()))
            .addClass('small')
            .onClicked(() => {
                this.formItemOccurrences
                    .createAndAddOccurrence(this.formItemOccurrences.countOccurrences(), false)
                    .then((item: V) => this.expandOccurrenceView(item)
                );
        });
        return addButton;
    }

    expandRecursively() {
        this.toggleOccurrencesVisibility(true);
        this.formItemOccurrences.getOccurrenceViews().forEach((item: V) => this.expandOccurrenceView(item));
    }

    private expandOccurrenceView(item: FormSetOccurrenceView) {
        item.setContainerVisible(true);
        const processFormItemView = (formItemView: FormItemView) => {
            if (formItemView instanceof FormSetView) {
                (formItemView).expandRecursively();
            } else if (formItemView instanceof FormOptionSetOptionView) {
                (formItemView).getFormItemViews().forEach(processFormItemView);
            }
        };
        item.getFormItemViews().forEach(processFormItemView);
    }

    private refreshButtonsState() {
        const occurrenceCount = this.formItemOccurrences.getOccurrences().length;
        this.updateCollapseButtons();
        this.addButton.setVisible(!this.formItemOccurrences.maximumOccurrencesReached());
        this.toggleClass('multiple-occurrence', occurrenceCount > 1);
    }

}
