import * as Q from 'q';
import {Property} from '../data/Property';
import {PropertyArray} from '../data/PropertyArray';
import {PropertySet} from '../data/PropertySet';
import {DivEl} from '../dom/DivEl';
import {Button} from '../ui/button/Button';
import {TogglerButton} from '../ui/button/TogglerButton';
import {assertNotNull} from '../util/Assert';
import {i18n} from '../util/Messages';
import {StringHelper} from '../util/StringHelper';
import {FormContext} from './FormContext';
import {FormItemOccurrenceView} from './FormItemOccurrenceView';
import {FormItemView, FormItemViewConfig} from './FormItemView';
import {HelpTextContainer} from './HelpTextContainer';
import {Input} from './Input';
import {InputLabel} from './InputLabel';
import {InputTypeManager} from './inputtype/InputTypeManager';
import {InputTypeView} from './inputtype/InputTypeView';
import {InputValidationRecording} from './inputtype/InputValidationRecording';
import {InputValidityChangedEvent} from './inputtype/InputValidityChangedEvent';
import {BaseInputType} from './inputtype/support/BaseInputType';
import {BaseInputTypeNotManagingAdd} from './inputtype/support/BaseInputTypeNotManagingAdd';
import {InputTypeName} from './InputTypeName';
import {InputViewValidationViewer} from './InputViewValidationViewer';
import {OccurrenceRemovedEvent} from './OccurrenceRemovedEvent';
import {RecordingValidityChangedEvent} from './RecordingValidityChangedEvent';
import {ValidationRecording} from './ValidationRecording';
import {ValidationRecordingPath} from './ValidationRecordingPath';
import {AiToolType} from '../ai/tool/AiToolType';
import {LabelEl} from '../dom/LabelEl';

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

    private readonly input: Input;
    private parentPropertySet: PropertySet;
    private propertyArray: PropertyArray;
    private inputTypeView: InputTypeView;
    private inputLabelView: InputLabel;
    private bottomButtonRow?: DivEl;
    private addButton?: Button;
    private validationViewer: InputViewValidationViewer;
    private validationDetailsToggler: TogglerButton;
    private previousValidityRecording: ValidationRecording;
    private validityChangedListeners: ((event: RecordingValidityChangedEvent) => void)[] = [];
    private helpText?: HelpTextContainer;

    constructor(config: InputViewConfig) {
        super({
            className: 'input-view',
            context: config.context,
            formItem: config.input,
            parent: config.parent
        } as FormItemViewConfig);

        assertNotNull(config.parentDataSet, 'parentDataSet not expected to be null');
        assertNotNull(config.input, 'input not expected to be null');

        this.input = config.input;
        this.parentPropertySet = config.parentDataSet;
    }

    public layout(validate: boolean = true): Q.Promise<void> {

        if (this.input.getInputType().getName().toLowerCase() !== 'checkbox') { //checkbox input type generates clickable label itself
            if (this.input.getLabel()) {
                this.inputLabelView = new InputLabel(this.input);
                this.appendChild(this.inputLabelView);
            } else {
                this.addClass('no-label');
            }
        }

        this.inputTypeView = this.createInputTypeView(this.inputLabelView?.getLabelEl());
        const hasAiIcon = this.inputTypeView.getAiConfig()?.aiTools.has(AiToolType.DIALOG);
        this.toggleClass('ai-editable', hasAiIcon);

        if (this.input.getHelpText()) {
            this.helpText = new HelpTextContainer(this.input.getHelpText());

            if (!hasAiIcon) {
                this.appendChild(this.helpText.getToggler());
            }
        }

        if (this.input.isMaximizeUIInputWidth() === false) {
            this.addClass('label-inline');
        }

        this.propertyArray = this.getPropertyArray(this.parentPropertySet);

        return this.inputTypeView.layout(this.input, this.propertyArray).then(() => {
            this.appendChild(this.inputTypeView.getElement());

            if (this.helpText) {
                this.appendChild(this.helpText.getHelpText());
            }

            if (!this.inputTypeView.isManagingAdd()) {
                const inputTypeViewNotManagingAdd: BaseInputTypeNotManagingAdd = this.inputTypeView as BaseInputTypeNotManagingAdd;
                inputTypeViewNotManagingAdd.onOccurrenceAdded(() => {
                    this.refreshButtonsState();
                });
                inputTypeViewNotManagingAdd.onOccurrenceRemoved((event: OccurrenceRemovedEvent) => {
                    this.refreshButtonsState();
                });

                this.addButton = new Button(i18n('action.add'));
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
                    this.toggleHasInvalidInputClass(this.inputTypeView as BaseInputType);
                });

                this.inputTypeView.onValueChanged(() => {
                    this.toggleHasInvalidInputClass(this.inputTypeView as BaseInputType);
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
        this.propertyArray = this.getPropertyArray(propertySet);

        return this.inputTypeView.update(this.propertyArray, unchangedOnly);
    }

    public reset(): void {
        this.inputTypeView.reset();
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

    hasNonDefaultNumberOfOccurrences(): boolean {
        return this.input.getOccurrences().required() && this.propertyArray.getSize() !== this.input.getOccurrences().getMinimum();
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
        this.helpText?.toggleHelpText(show);
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

    protected createInputTypeView(labelEl?: LabelEl): InputTypeView {
        let inputType: InputTypeName = this.input.getInputType();
        let inputTypeViewContext = this.getContext().createInputTypeViewContext(
            this.input.getInputTypeConfig() || {},
            this.parentPropertySet.getPropertyPath(),
            this.input,
            labelEl
        );

        if (InputTypeManager.isRegistered(inputType.getName())) {
            return InputTypeManager.createView(inputType.getName(), inputTypeViewContext);
        }

        console.warn('Input type [' + inputType.getName() + '] needs to be registered first.');
        return InputTypeManager.createView('NoInputTypeFound', inputTypeViewContext);
    }

    private refreshButtonsState() {
        if (!this.inputTypeView.isManagingAdd()) {
            const inputTypeViewNotManagingAdd = this.inputTypeView as BaseInputTypeNotManagingAdd;
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
