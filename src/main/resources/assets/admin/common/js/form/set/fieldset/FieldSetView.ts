import * as Q from 'q';
import {PropertySet} from '../../../data/PropertySet';
import {DivEl} from '../../../dom/DivEl';
import {DefaultErrorHandler} from '../../../DefaultErrorHandler';
import {ContentSummary} from '../../../content/ContentSummary';
import {FormItemOccurrenceView} from '../../FormItemOccurrenceView';
import {FieldSet} from './FieldSet';
import {FormItemView, FormItemViewConfig} from '../../FormItemView';
import {FormItemLayer} from '../../FormItemLayer';
import {InputView} from '../../InputView';
import {ValidationRecording} from '../../ValidationRecording';
import {RecordingValidityChangedEvent} from '../../RecordingValidityChangedEvent';
import {FieldSetLabel} from './FieldSetLabel';
import {CreatedFormItemLayerConfig, FormItemLayerFactory} from '../../FormItemLayerFactory';

export interface FieldSetViewConfig extends CreatedFormItemLayerConfig {

    layerFactory: FormItemLayerFactory;

    fieldSet: FieldSet;

    parent: FormItemOccurrenceView;

    dataSet?: PropertySet;
}

export class FieldSetView
    extends FormItemView {

    private fieldSet: FieldSet;

    private propertySet: PropertySet;

    private formItemViews: FormItemView[] = [];

    private formItemLayer: FormItemLayer;

    constructor(config: FieldSetViewConfig) {
        super(<FormItemViewConfig>{
            context: config.context,
            formItem: config.fieldSet,
            parent: config.parent,
            className: 'field-set-view'
        });

        this.formItemLayer = config.layerFactory.createLayer(config);

        this.fieldSet = config.fieldSet;
        this.propertySet = config.dataSet;
    }

    broadcastFormSizeChanged() {
        this.formItemViews.forEach((formItemView: FormItemView) => {
            formItemView.broadcastFormSizeChanged();
        });
    }

    public layout(): Q.Promise<void> {

        return this.doLayout();
    }

    getFormItemViews(): FormItemView[] {
        return this.formItemViews;
    }

    public update(propertySet: PropertySet, unchangedOnly?: boolean): Q.Promise<void> {
        if (InputView.debug) {
            console.debug('FieldSetView.update' + (unchangedOnly ? ' ( unchanged only)' : ''), propertySet);
        }
        this.propertySet = propertySet;

        return this.formItemLayer.update(propertySet, unchangedOnly);
    }

    public reset() {
        this.formItemLayer.reset();
    }

    onEditContentRequest(listener: (content: ContentSummary) => void) {
        super.onEditContentRequest(listener);
        this.formItemViews.forEach((formItemView: FormItemView) => {
            formItemView.onEditContentRequest(listener);
        });
    }

    unEditContentRequest(listener: (content: ContentSummary) => void) {
        super.unEditContentRequest(listener);
        this.formItemViews.forEach((formItemView: FormItemView) => {
            formItemView.unEditContentRequest(listener);
        });
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

    public displayValidationErrors(value: boolean) {
        this.formItemViews.forEach((view: FormItemView) => {
            view.displayValidationErrors(value);
        });
    }

    public setHighlightOnValidityChange(highlight: boolean) {
        this.formItemViews.forEach((view: FormItemView) => {
            view.setHighlightOnValidityChange(highlight);
        });
    }

    hasValidUserInput(): boolean {

        let result = true;
        this.formItemViews.forEach((formItemView: FormItemView) => {
            if (!formItemView.hasValidUserInput()) {
                result = false;
            }
        });

        return result;
    }

    validate(silent: boolean = true): ValidationRecording {

        let recording = new ValidationRecording();
        this.formItemViews.forEach((formItemView: FormItemView) => {
            recording.flatten(formItemView.validate(silent));
        });

        return recording;
    }

    isEmpty(): boolean {
        return this.formItemViews.every((formItemView: FormItemView) => formItemView.isEmpty());
    }

    onValidityChanged(listener: (event: RecordingValidityChangedEvent) => void) {

        this.formItemViews.forEach((formItemView: FormItemView) => {
            formItemView.onValidityChanged(listener);
        });
    }

    unValidityChanged(listener: (event: RecordingValidityChangedEvent) => void) {
        this.formItemViews.forEach((formItemView: FormItemView) => {
            formItemView.unValidityChanged(listener);
        });
    }

    onFocus(listener: (event: FocusEvent) => void) {
        this.formItemViews.forEach((formItemView) => {
            formItemView.onFocus(listener);
        });
    }

    unFocus(listener: (event: FocusEvent) => void) {
        this.formItemViews.forEach((formItemView) => {
            formItemView.unFocus(listener);
        });
    }

    onBlur(listener: (event: FocusEvent) => void) {
        this.formItemViews.forEach((formItemView) => {
            formItemView.onBlur(listener);
        });
    }

    unBlur(listener: (event: FocusEvent) => void) {
        this.formItemViews.forEach((formItemView) => {
            formItemView.unBlur(listener);
        });
    }

    private doLayout(): Q.Promise<void> {

        let deferred = Q.defer<void>();

        let label = new FieldSetLabel(this.fieldSet);
        this.appendChild(label);

        let wrappingDiv = new DivEl('field-set-container');
        this.appendChild(wrappingDiv);

        let layoutPromise: Q.Promise<FormItemView[]> = this.formItemLayer.setFormItems(this.fieldSet.getFormItems()).setParentElement(
            wrappingDiv).setParent(this.getParent()).layout(this.propertySet);
        layoutPromise.then((formItemViews: FormItemView[]) => {
            this.formItemViews = formItemViews;

            deferred.resolve(null);
        }).catch((reason: any) => {
            let fieldSetValue = this.fieldSet ? this.fieldSet.toJson() : {};
            console.error('Could not render FieldSet view: ' + reason + '\r\n FieldSet value:', JSON.stringify(fieldSetValue));
            DefaultErrorHandler.handle(reason);
        }).done();

        return deferred.promise;
    }
}
