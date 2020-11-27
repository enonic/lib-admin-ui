import * as Q from 'q';
import {PropertyArray} from '../data/PropertyArray';
import {PropertySet} from '../data/PropertySet';
import {Property} from '../data/Property';
import {BaseInputTypeNotManagingAdd} from './inputtype/support/BaseInputTypeNotManagingAdd';
import {i18n} from '../util/Messages';
import {StringHelper} from '../util/StringHelper';
import {Value} from '../data/Value';
import {FormItemView, FormItemViewConfig} from './FormItemView';
import {InputTypeView} from './inputtype/InputTypeView';
import {DivEl} from '../dom/DivEl';
import {Button} from '../ui/button/Button';
import {ValidationRecordingViewer} from './ValidationRecordingViewer';
import {ContentSummary} from '../content/ContentSummary';
import {OccurrenceRemovedEvent} from './OccurrenceRemovedEvent';
import {ObjectHelper} from '../ObjectHelper';
import {InputOccurrenceView} from './inputtype/support/InputOccurrenceView';
import {InputValidityChangedEvent} from './inputtype/InputValidityChangedEvent';
import {InputTypeName} from './InputTypeName';
import {InputValidationRecording} from './inputtype/InputValidationRecording';
import {FormContext} from './FormContext';
import {Input} from './Input';
import {FormItemOccurrenceView} from './FormItemOccurrenceView';
import {ValidationRecording} from './ValidationRecording';
import {RecordingValidityChangedEvent} from './RecordingValidityChangedEvent';
import {HelpTextContainer} from './HelpTextContainer';
import {assertNotNull} from '../util/Assert';
import {InputLabel} from './InputLabel';
import {InputTypeManager} from './inputtype/InputTypeManager';
import {ValidationRecordingPath} from './ValidationRecordingPath';

export interface InputViewConfig {

    context: FormContext;

    input: Input;

    parent: FormItemOccurrenceView;

    parentDataSet: PropertySet;
}

export class InputView
    extends FormItemView {

    public static debug: boolean = false;
    private input: Input;
    private parentPropertySet: PropertySet;
    private propertyArray: PropertyArray;
    private inputTypeView: InputTypeView;
    private bottomButtonRow: DivEl;
    private addButton: Button;
    private validationViewer: ValidationRecordingViewer;
    private previousValidityRecording: ValidationRecording;
    private userInputValid: boolean;
    private validityChangedListeners: { (event: RecordingValidityChangedEvent): void }[] = [];
    private helpText: HelpTextContainer;

    constructor(config: InputViewConfig) {
        super(<FormItemViewConfig>{
            className: 'input-view',
            context: config.context,
            formItem: config.input,
            parent: config.parent
        });

        assertNotNull(config.parentDataSet, 'parentDataSet not expected to be null');
        assertNotNull(config.input, 'input not expected to be null');

        this.input = config.input;
        this.parentPropertySet = config.parentDataSet;

    }

    public layout(validate: boolean = true): Q.Promise<void> {

        if (this.input.getInputType().getName().toLowerCase() !== 'checkbox') { //checkbox input type generates clickable label itself
            if (this.input.getLabel()) {
                let label = new InputLabel(this.input);
                this.appendChild(label);
            } else {
                this.addClass('no-label');
            }
        }

        if (this.input.getHelpText()) {
            this.helpText = new HelpTextContainer(this.input.getHelpText());

            this.appendChild(this.helpText.getToggler());
        }

        if (this.input.isMaximizeUIInputWidth() !== true) {
            this.addClass('label-inline');
        }

        this.inputTypeView = this.createInputTypeView();
        this.inputTypeView.onEditContentRequest((content: ContentSummary) => {
            this.notifyEditContentRequested(content);
        });

        this.propertyArray = this.getPropertyArray(this.parentPropertySet);

        return this.inputTypeView.layout(this.input, this.propertyArray).then(() => {
            this.appendChild(this.inputTypeView.getElement());

            if (!!this.helpText) {
                this.appendChild(this.helpText.getHelpText());
            }

            if (!this.inputTypeView.isManagingAdd()) {

                let inputTypeViewNotManagingAdd = <BaseInputTypeNotManagingAdd>this.inputTypeView;
                inputTypeViewNotManagingAdd.onOccurrenceAdded(() => {
                    this.refreshButtonsState();
                });
                inputTypeViewNotManagingAdd.onOccurrenceRemoved((event: OccurrenceRemovedEvent) => {
                    this.refreshButtonsState();

                    if (ObjectHelper.iFrameSafeInstanceOf(event.getOccurrenceView(),
                        InputOccurrenceView)) {
                        // force validate, since InputView might have become invalid
                        this.validate(false);
                    }
                });

                this.addButton = new Button(i18n('action.add'));
                this.addButton.addClass('small');
                this.addButton.onClicked(() => inputTypeViewNotManagingAdd.createAndAddOccurrence());

                this.bottomButtonRow = new DivEl('bottom-button-row');
                this.appendChild(this.bottomButtonRow);
                this.bottomButtonRow.appendChild(this.addButton);
            }

            this.validationViewer = new ValidationRecordingViewer();
            this.appendChild(this.validationViewer);

            this.inputTypeView.onValidityChanged((event: InputValidityChangedEvent) => {
                this.handleInputValidationRecording(event.getRecording(), false);
            });

            this.refreshButtonsState(validate);
        });
    }

    public update(propertySet: PropertySet, unchangedOnly?: boolean): Q.Promise<void> {
        if (InputView.debug) {
            console.debug('InputView.update' + (unchangedOnly ? ' ( unchanged only)' : ''), this, propertySet);
        }
        // update parent first because it can be used in getPropertyArray
        this.parentPropertySet = propertySet;
        this.propertyArray = this.getPropertyArray(propertySet);

        return this.inputTypeView.update(this.propertyArray, unchangedOnly);
    }

    public reset() {
        this.inputTypeView.reset();
    }

    refresh() {
        this.inputTypeView.refresh();
    }

    hasNonDefaultValues(): boolean {
        return this.propertyArray.some((property: Property) => {
            return !StringHelper.isEmpty(property.getValue().getString()) && !property.getValue().equals(this.input.getDefaultValue());
        });
    }

    isEmpty(): boolean {
        return !this.propertyArray.some((property: Property) => {
            return !StringHelper.isEmpty(property.getValue().getString());
        });
    }

    public getInputTypeView(): InputTypeView {
        return this.inputTypeView;
    }

    broadcastFormSizeChanged() {
        if (this.isVisible()) {
            this.inputTypeView.availableSizeChanged();
        }
    }

    public displayValidationErrors(value: boolean) {
        this.inputTypeView.displayValidationErrors(value);
    }

    hasValidUserInput(recording?: InputValidationRecording): boolean {

        return this.inputTypeView.hasValidUserInput(recording);
    }

    validate(silent: boolean = true): ValidationRecording {

        let inputRecording = this.inputTypeView.validate(silent);
        return this.handleInputValidationRecording(inputRecording, silent);
    }

    userInputValidityChanged(currentState: boolean): boolean {
        return this.userInputValid == null || this.userInputValid == null || !(this.userInputValid === currentState);
    }

    giveFocus(): boolean {
        return this.inputTypeView.giveFocus();
    }

    onValidityChanged(listener: (event: RecordingValidityChangedEvent) => void) {
        this.validityChangedListeners.push(listener);
    }

    unValidityChanged(listener: (event: RecordingValidityChangedEvent) => void) {
        this.validityChangedListeners.filter((currentListener: (event: RecordingValidityChangedEvent) => void) => {
            return listener === currentListener;
        });
    }

    onFocus(listener: (event: FocusEvent) => void) {
        this.inputTypeView.onFocus(listener);
    }

    unFocus(listener: (event: FocusEvent) => void) {
        this.inputTypeView.unFocus(listener);
    }

    onBlur(listener: (event: FocusEvent) => void) {
        this.inputTypeView.onBlur(listener);
    }

    unBlur(listener: (event: FocusEvent) => void) {
        this.inputTypeView.unBlur(listener);
    }

    toggleHelpText(show?: boolean) {
        if (!!this.helpText) {
            this.helpText.toggleHelpText(show);
        }
    }

    hasHelpText(): boolean {
        return !!this.input.getHelpText();
    }

    private getPropertyArray(propertySet: PropertySet): PropertyArray {
        let array = propertySet.getPropertyArray(this.input.getName());
        if (!array) {
            array = PropertyArray.create().setType(this.inputTypeView.getValueType()).setName(this.input.getName()).setParent(
                this.parentPropertySet).build();

            propertySet.addPropertyArray(array);

            let initialValue = this.input.getDefaultValue();
            if (!initialValue) {
                initialValue = this.inputTypeView.newInitialValue();
            }
            if (initialValue) {
                array.add(initialValue);
            }
        }
        return array;
    }

    private createInputTypeView(): InputTypeView {
        let inputType: InputTypeName = this.input.getInputType();
        let inputTypeViewContext = this.getContext().createInputTypeViewContext(
            this.input.getInputTypeConfig() || {},
            this.parentPropertySet.getPropertyPath(),
            this.input
        );

        if (InputTypeManager.isRegistered(inputType.getName())) {
            return InputTypeManager.createView(inputType.getName(), inputTypeViewContext);
        }

        console.warn('Input type [' + inputType.getName() + '] needs to be registered first.');
        return InputTypeManager.createView('NoInputTypeFound', inputTypeViewContext);
    }

    private refreshButtonsState(validate: boolean = true) {
        if (!this.inputTypeView.isManagingAdd()) {
            let inputTypeViewNotManagingAdd = <BaseInputTypeNotManagingAdd>this.inputTypeView;
            this.addButton.setVisible(!inputTypeViewNotManagingAdd.maximumOccurrencesReached());
        }
        if (validate) {
            this.validate(false);
        }
    }

    private resolveValidationRecordingPath(): ValidationRecordingPath {

        return new ValidationRecordingPath(this.propertyArray.getParentPropertyPath(), this.input.getName(),
            this.input.getOccurrences().getMinimum(),
            this.input.getOccurrences().getMaximum());
    }

    private handleInputValidationRecording(inputRecording: InputValidationRecording,
                                           silent: boolean = true): ValidationRecording {

        let recording = new ValidationRecording();
        let validationRecordingPath = this.resolveValidationRecordingPath();
        let hasValidInput = this.hasValidUserInput(inputRecording);

        if (inputRecording.isMinimumOccurrencesBreached()) {
            recording.breaksMinimumOccurrences(validationRecordingPath);
        }
        if (inputRecording.isMaximumOccurrencesBreached()) {
            recording.breaksMaximumOccurrences(validationRecordingPath);
        }

        if (recording.validityChanged(this.previousValidityRecording) || this.userInputValidityChanged(hasValidInput)) {
            if (!silent) {
                this.notifyValidityChanged(new RecordingValidityChangedEvent(recording,
                    validationRecordingPath).setInputValueBroken(!hasValidInput));
            }
            this.toggleClass('highlight-validity-change', this.highlightOnValidityChange());
        }

        const initialValue: Value = this.inputTypeView.newInitialValue();

        this.toggleClass('display-validation-errors', !!initialValue && !StringHelper.isEmpty(initialValue.getString()));

        if (!silent && (recording.validityChanged(this.previousValidityRecording) || this.userInputValidityChanged(hasValidInput))) {
            this.notifyValidityChanged(new RecordingValidityChangedEvent(recording,
                validationRecordingPath).setInputValueBroken(!hasValidInput));
        }

        this.previousValidityRecording = recording;
        this.userInputValid = hasValidInput;

        this.renderValidationErrors(recording, inputRecording);
        return recording;
    }

    private notifyValidityChanged(event: RecordingValidityChangedEvent) {

        this.validityChangedListeners.forEach((listener: (event: RecordingValidityChangedEvent) => void) => {
            listener(event);
        });
    }

    private renderValidationErrors(recording: ValidationRecording, inputRecording: InputValidationRecording) {
        if (!this.mayRenderValidationError()) {
            return;
        }

        if (recording.isValid() && this.hasValidUserInput(inputRecording)) {
            this.removeClass('invalid');
            this.addClass('valid');
        } else {
            this.removeClass('valid');
            this.addClass('invalid');
        }

        this.validationViewer.setObject(recording);

        if (inputRecording.hasAdditionalValidationRecord() && inputRecording.getAdditionalValidationRecord().isOverwriteDefault()) {
            this.validationViewer.appendValidationMessage(inputRecording.getAdditionalValidationRecord().getMessage());
        }
    }

    private mayRenderValidationError(): boolean {
        return this.input.getInputType().getName() !== 'SiteConfigurator';
    }
}
