import * as Q from 'q';
import {PropertyArray} from '../data/PropertyArray';
import {PropertySet} from '../data/PropertySet';
import {Property} from '../data/Property';
import {BaseInputTypeNotManagingAdd} from './inputtype/support/BaseInputTypeNotManagingAdd';
import {i18n} from '../util/Messages';
import {StringHelper} from '../util/StringHelper';
import {FormItemView, FormItemViewConfig} from './FormItemView';
import {InputTypeView} from './inputtype/InputTypeView';
import {DivEl} from '../dom/DivEl';
import {Button} from '../ui/button/Button';
import {OccurrenceRemovedEvent} from './OccurrenceRemovedEvent';
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
import {InputViewValidationViewer} from './InputViewValidationViewer';
import {TogglerButton} from '../ui/button/TogglerButton';
import {BaseInputType} from './inputtype/support/BaseInputType';
import {Value} from '../data/Value';
import {InputTypeViewContext} from './inputtype/InputTypeViewContext';

export interface InputViewConfig {

    context: FormContext;

    input: Input;

    parent: FormItemOccurrenceView;

    parentDataSet: PropertySet;
}

export class InputView
    extends FormItemView {

    public static debug: boolean = false;
    private static ERROR_DETAILS_HIDDEN_CLS: string = 'error-details-hidden';

    private input: Input;
    private parentPropertySet: PropertySet;
    private propertyArray: PropertyArray;
    private inputTypeView: InputTypeView;
    private bottomButtonRow?: DivEl;
    private addButton?: Button;
    private validationViewer: InputViewValidationViewer;
    private validationDetailsToggler: TogglerButton;
    private previousValidityRecording: ValidationRecording;
    private validityChangedListeners: { (event: RecordingValidityChangedEvent): void }[] = [];
    private helpText?: HelpTextContainer;
    private isExistingPropertyArray: boolean;

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

        if (this.input.isMaximizeUIInputWidth() === false) {
            this.addClass('label-inline');
        }

        this.inputTypeView = this.createInputTypeView();

        this.propertyArray = this.getOrPopulatePropertyArray(this.parentPropertySet);

        this.propertyArray.onPropertyAdded(() => {
            console.log(this.isEmpty());
            this.attachOrDetachPropertyArray();
        });

        this.propertyArray.onPropertyRemoved(() => {
            console.log(this.isEmpty());
            this.attachOrDetachPropertyArray();
        });

        this.propertyArray.onPropertyValueChanged(() => {
            console.log(this.isEmpty());
            this.attachOrDetachPropertyArray();
        });

        return this.inputTypeView.layout(this.input, this.propertyArray).then(() => {
            this.appendChild(this.inputTypeView.getElement());

            if (!!this.helpText) {
                this.appendChild(this.helpText.getHelpText());
            }

            if (!this.inputTypeView.isManagingAdd()) {
                const inputTypeViewNotManagingAdd: BaseInputTypeNotManagingAdd = <BaseInputTypeNotManagingAdd>this.inputTypeView;
                inputTypeViewNotManagingAdd.onOccurrenceAdded(() => {
                    this.refreshButtonsState();
                });
                inputTypeViewNotManagingAdd.onOccurrenceRemoved((event: OccurrenceRemovedEvent) => {
                    this.refreshButtonsState();
                });

                this.addButton = new Button(i18n('action.add'));
                this.addButton.addClass('small');
                this.addButton.onClicked(() => inputTypeViewNotManagingAdd.createAndAddOccurrence());

                this.bottomButtonRow = new DivEl('bottom-button-row');
                this.appendChild(this.bottomButtonRow);
                this.bottomButtonRow.appendChild(this.addButton);

                this.toggleClass('single-occurrence', this.isSingleOccurrence());

                inputTypeViewNotManagingAdd.onOccurrenceValueChanged(() => {
                    this.toggleHasInvalidInputClass(inputTypeViewNotManagingAdd);
                });

                inputTypeViewNotManagingAdd.onValidityChanged((event: InputValidityChangedEvent) => {
                    this.toggleHasInvalidInputClass(inputTypeViewNotManagingAdd);
                });

                this.toggleHasInvalidInputClass(inputTypeViewNotManagingAdd);
            } else {
                this.inputTypeView.onValidityChanged(() => {
                    this.toggleHasInvalidInputClass(<BaseInputType>this.inputTypeView);
                });

                this.inputTypeView.onValueChanged(() => {
                    this.toggleHasInvalidInputClass(<BaseInputType>this.inputTypeView);
                });
            }

            this.validationViewer = new InputViewValidationViewer();
            this.validationDetailsToggler = new TogglerButton('validation-toggler');
            this.validationDetailsToggler.setLabel(i18n('field.validation.hideDetails'));
            this.validationDetailsToggler.setEnabled(true);
            const validationBlock: DivEl = new DivEl('validation-block');
            validationBlock.appendChild(this.validationViewer);
            validationBlock.appendChild(this.validationDetailsToggler);
            this.appendChild(validationBlock);

            this.inputTypeView.onValidityChanged((event: InputValidityChangedEvent) => {
                this.handleInputValidationRecording(event.getRecording(), false);
            });

            this.validationDetailsToggler.onActiveChanged((isActive: boolean) => {
                this.toggleClass(InputView.ERROR_DETAILS_HIDDEN_CLS, isActive);
                this.validationDetailsToggler.setLabel(
                    isActive ? i18n('field.validation.showDetails') : i18n('field.validation.hideDetails'));
            });

            if (this.inputTypeView.hideValidationDetailsByDefault() &&
                !this.isFormStateNew() &&
                this.input.getOccurrences().getMinimum() > 0 &&
                this.input.getOccurrences().getMaximum() > 1) {
                this.validationDetailsToggler.setActive(true);
            }

            this.refreshButtonsState();

            return Q(null);
        });
    }

    private isSingleOccurrence(): boolean {
        return this.input.getOccurrences().getMinimum() === 1 && this.input.getOccurrences().getMaximum() === 1;
    }

    private toggleHasInvalidInputClass(inputTypeView: BaseInputType) {
        this.toggleClass('has-invalid-user-input', !inputTypeView.hasValidUserInput());
    }

    public update(propertySet: PropertySet, unchangedOnly?: boolean): Q.Promise<void> {
        if (InputView.debug) {
            console.debug('InputView.update' + (unchangedOnly ? ' ( unchanged only)' : ''), this, propertySet);
        }
        // update parent first because it can be used in getPropertyArray
        this.parentPropertySet = propertySet;
        this.propertyArray = this.getOrPopulatePropertyArray(propertySet);

        return this.inputTypeView.update(this.propertyArray, unchangedOnly);
    }

    public reset(): void {
        this.inputTypeView.reset();
    }

    private attachOrDetachPropertyArray(): void {
        if (this.isEmpty()) {
            if (!this.isExistingPropertyArray && this.parentPropertySet.getPropertyArray(this.input.getName())) {
                this.parentPropertySet.removePropertyArray(this.propertyArray);
            }
        } else {
            if (!this.parentPropertySet.getPropertyArray(this.input.getName())) {
                this.parentPropertySet.addPropertyArray(this.propertyArray);
            }
        }
    }

    clear(): void {
        super.clear();

        this.previousValidityRecording = null;
        this.inputTypeView.clear();
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

    setEnabled(enable: boolean) {
        this.inputTypeView.setEnabled(enable);

        if (this.addButton) {
            this.addButton.setEnabled(enable);
        }
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
        this.inputTypeView.displayValidationErrors();
    }

    hasValidUserInput(): boolean {
        return this.inputTypeView.hasValidUserInput();
    }

    validate(silent: boolean = true): ValidationRecording {
        this.inputTypeView.validate(silent);
        return this.handleInputValidationRecording(this.inputTypeView.getInputValidationRecording(), silent);
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

    private getOrPopulatePropertyArray(propertySet: PropertySet): PropertyArray {
        let array = propertySet.getPropertyArray(this.input.getName());

        if (array) {
            this.isExistingPropertyArray = true;
            return array;
        }

        array = PropertyArray.create()
            .setType(this.inputTypeView.getValueType())
            .setName(this.input.getName())
            .setParent(this.parentPropertySet).build();

        const initialValue: Value = this.inputTypeView.newInitialValue();

        if (initialValue) {
            array.add(initialValue);
        }

        return array;
    }

    protected createInputTypeView(): InputTypeView {
        const inputType: InputTypeName = this.input.getInputType();
        const inputTypeViewContext: InputTypeViewContext = this.getContext().createInputTypeViewContext(
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

    private refreshButtonsState() {
        if (!this.inputTypeView.isManagingAdd()) {
            const inputTypeViewNotManagingAdd = <BaseInputTypeNotManagingAdd>this.inputTypeView;
            const isMaxOccurrencesReached = inputTypeViewNotManagingAdd.maximumOccurrencesReached();
            this.bottomButtonRow.toggleClass('visible', !isMaxOccurrencesReached);
            this.addButton.setVisible(!isMaxOccurrencesReached);
        }
    }

    private resolveValidationRecordingPath(): ValidationRecordingPath {
        return new ValidationRecordingPath(this.propertyArray.getParentPropertyPath(), this.input.getName(),
            this.input.getOccurrences().getMinimum(),
            this.input.getOccurrences().getMaximum());
    }

    private handleInputValidationRecording(inputRecording: InputValidationRecording, silent: boolean = true): ValidationRecording {
        const recording: ValidationRecording = new ValidationRecording();
        const validationRecordingPath: ValidationRecordingPath = this.resolveValidationRecordingPath();

        if (inputRecording?.isMinimumOccurrencesBreached()) {
            recording.breaksMinimumOccurrences(validationRecordingPath);
        }

        if (inputRecording?.isMaximumOccurrencesBreached()) {
            recording.breaksMaximumOccurrences(validationRecordingPath);
        }

        if (inputRecording?.hasErrorMessage()) {
            recording.addValidationError(validationRecordingPath.toString(), inputRecording.getErrorMessage());
        }

        if (recording.validityChanged(this.previousValidityRecording)) {
            if (!silent) {
                this.notifyValidityChanged(new RecordingValidityChangedEvent(recording, validationRecordingPath));
            }
            this.toggleClass('highlight-validity-change', this.highlightOnValidityChange());
        }

        this.previousValidityRecording = recording;

        if (inputRecording && this.inputTypeView.isValidationErrorToBeRendered() && !this.isFormStateNew()) {
            this.renderValidationErrors(inputRecording);
        }

        return recording;
    }

    private notifyValidityChanged(event: RecordingValidityChangedEvent) {
        this.validityChangedListeners.forEach((listener: (event: RecordingValidityChangedEvent) => void) => {
            listener(event);
        });
    }

    private renderValidationErrors(recording: InputValidationRecording) {
        this.toggleClass('valid', recording.isValid());
        this.toggleClass('invalid', !recording.isValid());

        this.validationViewer.setObject(recording);
    }

    private isFormStateNew(): boolean {
        return this.getContext()?.getFormState()?.isNew();
    }

}
