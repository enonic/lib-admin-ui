import Q from 'q';
import {AiAnimationTool} from '../../../ai/tool/AiAnimationTool';
import {AiDialogIconTool} from '../../../ai/tool/AiDialogIconTool';
import {AiStateTool} from '../../../ai/tool/AiStateTool';
import {AiToolType} from '../../../ai/tool/AiToolType';
import {Property} from '../../../data/Property';
import {PropertyPath} from '../../../data/PropertyPath';
import {PropertyValueChangedEvent} from '../../../data/PropertyValueChangedEvent';
import {Value} from '../../../data/Value';
import {ButtonEl} from '../../../dom/ButtonEl';
import {DivEl} from '../../../dom/DivEl';
import {Element} from '../../../dom/Element';
import {FormItemOccurrenceView, FormItemOccurrenceViewConfig} from '../../FormItemOccurrenceView';
import {BaseInputTypeNotManagingAdd} from './BaseInputTypeNotManagingAdd';
import {InputOccurrence} from './InputOccurrence';
import {OccurrenceValidationRecord} from './OccurrenceValidationRecord';

export interface InputOccurrenceViewConfig
    extends FormItemOccurrenceViewConfig {
    inputTypeView: BaseInputTypeNotManagingAdd;
    property: Property;
}

export class InputOccurrenceView
    extends FormItemOccurrenceView {

    public static debug: boolean = false;
    declare protected config: InputOccurrenceViewConfig;
    private property: Property;
    private inputTypeView: BaseInputTypeNotManagingAdd;
    private inputElement: Element;
    private inputWrapper: DivEl;
    private removeButtonEl: ButtonEl;
    private dragControl: DivEl;
    private propertyValueChangedHandler: (event: PropertyValueChangedEvent) => void;
    private occurrenceValueChangedHandler: (occurrence: Element, value: Value) => void;
    private validationErrorBlock: DivEl;

    constructor(inputOccurrence: InputOccurrence, baseInputTypeView: BaseInputTypeNotManagingAdd, property: Property) {
        super({
            className: 'input-occurrence-view',
            formItemOccurrence: inputOccurrence,
            inputTypeView: baseInputTypeView,
            property: property,
        } as InputOccurrenceViewConfig);

        this.refresh();
    }

    protected initElements(): void {
        super.initElements();

        this.inputTypeView = this.config.inputTypeView;
        this.property = this.config.property;
        this.inputWrapper = new DivEl('input-wrapper');

        this.inputElement = this.inputTypeView.createInputOccurrenceElement(this.formItemOccurrence.getIndex(), this.property);
        this.dragControl = new DivEl('drag-control');
        this.validationErrorBlock = new DivEl('error-block');
        this.removeButtonEl = new ButtonEl();
    }

    layout(_validate: boolean = true): Q.Promise<void> {
        return super.layout(_validate).then(() => {
            const dataBlock: DivEl = new DivEl('data-block');

            this.appendChild(dataBlock);
            dataBlock.appendChild(this.dragControl);
            dataBlock.appendChild(this.inputWrapper);
            this.inputWrapper.prependChild(this.inputElement);
            dataBlock.appendChild(this.removeButtonEl);
            this.appendChild(this.validationErrorBlock);

            this.removeButtonEl.addClass('remove-button');

            return Q(null);
        });
    }

    update(property: Property, unchangedOnly?: boolean): Q.Promise<void> {
        this.registerProperty(property);

        this.inputTypeView.updateInputOccurrenceElement(this.inputElement, property, unchangedOnly);

        return Q<void>(null);
    }

    reset(): void {
        this.inputTypeView.resetInputOccurrenceElement(this.inputElement);
    }

    clear(): void {
        super.clear();
        this.inputTypeView.clearInputOccurrenceElement(this.inputElement);
    }

    setEnabled(enable: boolean) {
        this.inputTypeView.setEnabledInputOccurrenceElement(this.inputElement, enable);
        this.removeButtonEl.setEnabled(enable);
    }

    refresh() {
        if (this.formItemOccurrence.oneAndOnly()) {
            this.addClass('single-occurrence').removeClass('multiple-occurrence');
            this.inputTypeView.removeClass('has-multiple-occurrence');
        } else {
            this.addClass('multiple-occurrence').removeClass('single-occurrence');
            this.inputTypeView.addClass('has-multiple-occurrence');
        }

        this.removeButtonEl.setVisible(this.formItemOccurrence.isRemoveButtonRequiredStrict());
    }

    getDataPath(): PropertyPath {
        return this.property.getPath();
    }

    getIndex(): number {
        return this.formItemOccurrence.getIndex();
    }

    getInputElement(): Element {
        return this.inputElement;
    }

    hasValidUserInput(): boolean {
        return this.inputTypeView.isUserInputValid(this.inputElement);
    }

    giveFocus(): boolean {
        return this.inputElement.giveFocus();
    }

    onFocus(listener: (event: FocusEvent) => void) {
        this.inputElement.onFocus(listener);
    }

    unFocus(listener: (event: FocusEvent) => void) {
        this.inputElement.unFocus(listener);
    }

    onBlur(listener: (event: FocusEvent) => void) {
        this.inputElement.onBlur(listener);
    }

    unBlur(listener: (event: FocusEvent) => void) {
        this.inputElement.unBlur(listener);
    }

    protected initListeners(): void {
        super.initListeners();

        let ignorePropertyChange: boolean = false;

        this.occurrenceValueChangedHandler = (occurrence: Element, value: Value) => {
            // check if this is our occurrence because all views will receive occurrence value changed event
            if (this.inputElement === occurrence) {
                if (InputOccurrenceView.debug) {
                    console.debug('InputOccurrenceView: onOccurrenceValueChanged ', occurrence, value);
                }

                ignorePropertyChange = true;
                this.property.setValue(value);
                ignorePropertyChange = false;
            }
        };

        this.onAdded(() => {
            this.inputTypeView.onOccurrenceValueChanged(this.occurrenceValueChangedHandler);
        });

        this.propertyValueChangedHandler = (event: PropertyValueChangedEvent) => {
            const changedProperty: Property = event.getProperty();

            if (!ignorePropertyChange) {
                if (InputOccurrenceView.debug) {
                    console.debug('InputOccurrenceView: propertyValueChanged', changedProperty);
                }
                this.inputTypeView.updateInputOccurrenceElement(this.inputElement, changedProperty, !event.isForce());
            }
        };

        this.onRemoved(() => {
            if (this.property) {
                this.property.unPropertyValueChanged(this.propertyValueChangedHandler);
            }

            if (this.inputTypeView) {
                this.inputTypeView.unOccurrenceValueChanged(this.occurrenceValueChangedHandler);
            }
        });

        this.removeButtonEl.onClicked((event: MouseEvent) => {
            this.notifyRemoveButtonClicked();
            event.stopPropagation();
            event.preventDefault();
            return false;
        });

        this.property.onPropertyValueChanged(this.propertyValueChangedHandler);

        this.initAiFunctionality();
    }

    private initAiFunctionality(): void {
        const aiTools = this.inputTypeView.getAiConfig().aiTools;
        aiTools.forEach((aiTool) => this.addAiTool(aiTool));
    }

    private addAiTool(aiTool: AiToolType): void {
        if (aiTool === AiToolType.STATE) {
            new AiStateTool({
                stateContainer: this.inputWrapper,
                label: this.inputTypeView.getInput().getLabel(),
                pathElement: this.inputElement,
                getPath: () => this.getDataPath(),
                group: this.inputTypeView.getAiConfig().group,
            });

            return;
        }

        if (aiTool === AiToolType.DIALOG) {
            new AiDialogIconTool({
                group: this.inputTypeView.getAiConfig().group,
                getPath: () => this.getDataPath(),
                pathElement: this.inputElement,
                aiButtonContainer: this.inputTypeView,
                setContextOnFocus: true,
            });
            return;
        }

        if (aiTool === AiToolType.ANIMATE) {
            new AiAnimationTool({
                group: this.inputTypeView.getAiConfig().group,
                getPath: () => this.getDataPath(),
                pathElement: this.inputElement,
            });

            return;
        }

        console.warn('Unknown AI tool: ', aiTool);
    }

    private registerProperty(property: Property) {
        if (this.property) {
            if (InputOccurrenceView.debug) {
                console.debug('InputOccurrenceView.registerProperty: unregister old property', this.property);
            }
            this.property.unPropertyValueChanged(this.propertyValueChangedHandler);
        }
        if (property) {
            if (InputOccurrenceView.debug) {
                console.debug('InputOccurrenceView.registerProperty: register new property', property);
            }
            property.onPropertyValueChanged(this.propertyValueChangedHandler);
        }
        this.property = property;
    }

    displayValidationError(occurrenceValidationRecord: OccurrenceValidationRecord) {
        const errorMessage: string = occurrenceValidationRecord?.getAdditionalValidationRecords()[0]?.getMessage() || '';
        this.validationErrorBlock.setHtml(errorMessage);
        this.toggleClass('invalid', !!errorMessage);
    }
}
