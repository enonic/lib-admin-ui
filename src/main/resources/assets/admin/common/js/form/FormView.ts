import * as Q from 'q';
import {PropertySet} from '../data/PropertySet';
import {DivEl} from '../dom/DivEl';
import {ContentSummary} from '../content/ContentSummary';
import {FormEditEvent} from '../content/event/FormEditEvent';
import {WindowDOM} from '../dom/WindowDOM';
import {DefaultErrorHandler} from '../DefaultErrorHandler';
import {ObjectHelper} from '../ObjectHelper';
import {Form} from './Form';
import {FormItemView} from './FormItemView';
import {FormItemLayer} from './FormItemLayer';
import {FormValidityChangedEvent} from './FormValidityChangedEvent';
import {ValidationRecording} from './ValidationRecording';
import {FormContext} from './FormContext';
import {assert} from '../util/Assert';
import {RecordingValidityChangedEvent} from './RecordingValidityChangedEvent';
import {FormOptionSetView} from './set/optionset/FormOptionSetView';
import {FormItemLayerFactoryImpl} from './FormItemLayerFactory';

/**
 * Creates a UI component representing the given [[Form]] backed by given [[PropertySet]].
 * Form data is both read from and written to the given [[PropertySet]] as the user changes the form.
 *
 * When displaying a form for a empty PropertyTree, then FormItemSet's will not be displayed by default.
 * To enable displaying set [[FormContext.showEmptyFormItemSetOccurrences]] to true.
 */
export class FormView
    extends DivEl {

    public static debug: boolean = false;
    public static VALIDATION_CLASS: string = 'display-validation-errors';
    private form: Form;
    private data: PropertySet;
    private formItemViews: FormItemView[] = [];
    private formItemLayer: FormItemLayer;
    private formValidityChangedListeners: { (event: FormValidityChangedEvent): void }[] = [];
    private previousValidationRecording: ValidationRecording;
    private width: number;
    private focusListeners: { (event: FocusEvent): void }[] = [];
    private blurListeners: { (event: FocusEvent): void }[] = [];
    private layoutFinishedListeners: { (): void }[] = [];

    /**
     * @param context the form context.
     * @param form the form to display.
     * @param data the data to back the form with.
     */
    constructor(context: FormContext, form: Form, data: PropertySet) {
        super('form-view');
        this.form = form;
        this.data = data;

        this.formItemLayer = FormItemLayerFactoryImpl.get().createLayer({context});
    }

    /**
     * Lays out the form.
     */
    public layout(validate: boolean = true): Q.Promise<void> {

        let deferred = Q.defer<void>();

        if (!this.form) {
            deferred.resolve(null);
            return deferred.promise;
        }

        let formItems = this.form.getFormItems();
        let layoutPromise: Q.Promise<FormItemView[]> = this.formItemLayer.setFormItems(formItems).setParentElement(this).layout(
            this.data, validate);

        layoutPromise.then((formItemViews: FormItemView[]) => {

            this.formItemViews = formItemViews;
            assert(this.formItemViews.length === formItems.length,
                'Not all FormItemView-s was created. Expected ' + formItems.length + ', was: ' + formItemViews.length);

            deferred.resolve(null);

            this.formItemViews.forEach((formItemView: FormItemView) => {

                formItemView.onFocus((event: FocusEvent) => {
                    this.notifyFocused(event);
                });

                formItemView.onBlur((event: FocusEvent) => {
                    this.notifyBlurred(event);
                });

                formItemView.onValidityChanged((event: RecordingValidityChangedEvent) => {
                    if (!this.previousValidationRecording) {
                        this.previousValidationRecording = event.getRecording();
                        this.notifyValidityChanged(new FormValidityChangedEvent(this.previousValidationRecording,
                            event.isInputValueBroken()));
                    } else {
                        if (event.isValid()) {
                            this.previousValidationRecording.removeByPath(event.getOrigin(), false, event.isIncludeChildren());
                        } else {
                            this.previousValidationRecording.flatten(event.getRecording());
                        }

                        this.notifyValidityChanged(new FormValidityChangedEvent(this.previousValidationRecording,
                            event.isInputValueBroken()));

                    }
                });

                formItemView.onEditContentRequest((content: ContentSummary) => {
                    new FormEditEvent(content).fire();
                });
            });

            WindowDOM.get().onResized(() => this.checkSizeChanges(), this);
            this.onShown(() => this.checkSizeChanges());

        }).catch((reason: any) => {
            DefaultErrorHandler.handle(reason);
        }).done(() => {
            this.notifyLayoutFinished();
        });

        return deferred.promise;
    }

    clean() {
        this.formItemLayer.clean();
        this.formItemViews.forEach((view: FormItemView) => {
            if (ObjectHelper.iFrameSafeInstanceOf(view, FormOptionSetView)) {
                (<FormOptionSetView>view).clean();
            }
        });
    }

    public update(propertySet: PropertySet, unchangedOnly?: boolean): Q.Promise<void> {
        if (FormView.debug) {
            console.debug('FormView.update' + (unchangedOnly ? ' (unchanged only)' : ''), this, propertySet);
        }
        return this.formItemLayer.update(propertySet, unchangedOnly);
    }

    public reset() {
        return this.formItemLayer.reset();
    }

    public highlightInputsOnValidityChange(highlight: boolean) {
        this.formItemViews.forEach((formItemView: FormItemView) => {
            formItemView.setHighlightOnValidityChange(highlight);
        });
    }

    public hasValidUserInput(): boolean {

        let result = true;
        this.formItemViews.forEach((formItemView: FormItemView) => {
            if (!formItemView.hasValidUserInput()) {
                result = false;
            }
        });

        return result;
    }

    public validate(silent?: boolean, forceNotify: boolean = false): ValidationRecording {

        let recording: ValidationRecording = new ValidationRecording();
        this.formItemViews.forEach((formItemView: FormItemView) => {
            recording.flatten(formItemView.validate(silent));
        });

        if (!silent && (recording.validityChanged(this.previousValidationRecording) || forceNotify)) {
            this.notifyValidityChanged(new FormValidityChangedEvent(recording));
        }

        this.previousValidationRecording = recording;
        return recording;
    }

    public isValid(): boolean {
        if (!this.previousValidationRecording) {
            this.previousValidationRecording = this.validate(true);
        }
        return this.previousValidationRecording.isValid();
    }

    public displayValidationErrors(value: boolean) {
        if (value) {
            this.addClass(FormView.VALIDATION_CLASS);
        } else {
            this.removeClass(FormView.VALIDATION_CLASS);
        }
        for (let i = 0; i < this.formItemViews.length; i++) {
            this.formItemViews[i].displayValidationErrors(value);
        }
    }

    getData(): PropertySet {
        return this.data;
    }

    getForm(): Form {
        return this.form;
    }

    giveFocus(): boolean {
        let focusGiven = false;
        if (this.formItemViews.length > 0) {
            for (let i = 0; i < this.formItemViews.length; i++) {
                if (this.formItemViews[i].giveFocus()) {
                    focusGiven = true;
                    break;
                }
            }
        }
        return focusGiven;
    }

    onValidityChanged(listener: (event: FormValidityChangedEvent) => void) {
        this.formValidityChangedListeners.push(listener);
    }

    unValidityChanged(listener: (event: FormValidityChangedEvent) => void) {
        this.formValidityChangedListeners =
            this.formValidityChangedListeners.filter((currentListener: (event: FormValidityChangedEvent) => void) => {
                return listener !== currentListener;
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

    onLayoutFinished(listener: () => void) {
        this.layoutFinishedListeners.push(listener);
    }

    unLayoutFinished(listener: () => void) {
        this.layoutFinishedListeners = this.layoutFinishedListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    toggleHelpText(show?: boolean) {
        this.formItemLayer.toggleHelpText(show);
    }

    hasHelpText(): boolean {
        return this.formItemLayer.hasHelpText();
    }

    setLazyRender(value: boolean) {
        this.formItemLayer.setLazyRender(value);
    }

    private checkSizeChanges() {
        if (this.isVisible() && this.isSizeChanged()) {
            this.preserveCurrentSize();
            this.broadcastFormSizeChanged();
        }
    }

    private preserveCurrentSize() {
        this.width = this.getEl().getWidth();
    }

    private isSizeChanged(): boolean {
        return this.width !== this.getEl().getWidth();
    }

    private broadcastFormSizeChanged() {
        this.formItemViews.forEach((formItemView: FormItemView) => {
            formItemView.broadcastFormSizeChanged();
        });
    }

    private notifyValidityChanged(event: FormValidityChangedEvent) {
        //console.log('FormView.validityChanged');
        //if (event.getRecording().isValid()) {
        //    console.log(' valid: ');
        //}
        //else {
        //    console.log(' invalid: ');
        //    event.getRecording().print();
        //}

        this.formValidityChangedListeners.forEach((listener: (event: FormValidityChangedEvent) => void) => {
            listener.call(this, event);
        });
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

    private notifyLayoutFinished() {
        this.layoutFinishedListeners.forEach((listener) => {
            listener();
        });
    }
}
