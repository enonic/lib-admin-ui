import * as Q from 'q';
import {ClassHelper} from '../../../ClassHelper';
import {PropertyArray} from '../../../data/PropertyArray';
import {Value} from '../../../data/Value';
import {ValueType} from '../../../data/ValueType';
import {DivEl} from '../../../dom/DivEl';
import {Element} from '../../../dom/Element';
import {Input} from '../../Input';
import {InputTypeView} from '../InputTypeView';
import {InputTypeViewContext} from '../InputTypeViewContext';
import {InputValidationRecording} from '../InputValidationRecording';
import {InputValidityChangedEvent} from '../InputValidityChangedEvent';
import {ValueChangedEvent} from '../ValueChangedEvent';
import {AiConfig} from '../InputAiConfig';
import {AiToolType} from '../../../ai/tool/AiToolType';

export abstract class BaseInputType extends DivEl
    implements InputTypeView {

    protected input: Input;

    protected context: InputTypeViewContext;

    protected previousValidationRecording: InputValidationRecording;

    private inputValidityChangedListeners: ((event: InputValidityChangedEvent) => void)[] = [];

    protected constructor(context: InputTypeViewContext, className?: string) {
        super('input-type-view' + (className ? ' ' + className : ''));

        this.context = context;
        this.readInputConfig();
    }

    protected readInputConfig(): void {
    //
    }

    availableSizeChanged() {
        // must be implemented by children
    }

    displayValidationErrors() {
    //
    }

    getElement(): Element {
        return this;
    }

    isValidationErrorToBeRendered(): boolean {
        return true;
    }

    getInputValidationRecording(): InputValidationRecording {
        return this.previousValidationRecording;
    }

    getInput(): Input {
        return this.input;
    }

    abstract getValueType(): ValueType;

    hasValidUserInput(): boolean {
        return true;
    }

    isManagingAdd(): boolean {
        return false;
    }

    layout(input: Input, propertyArray: PropertyArray): Q.Promise<void> {
        this.input = input;
        return Q<void>(null);
    }

    newInitialValue(): Value {
        throw new Error('Must be overridden by inheritor: ' + ClassHelper.getClassName(this));
    }

    onValidityChanged(listener: (event: InputValidityChangedEvent) => void) {
        this.inputValidityChangedListeners.push(listener);
    }

    unValidityChanged(listener: (event: InputValidityChangedEvent) => void) {
        this.inputValidityChangedListeners.filter((currentListener: (event: InputValidityChangedEvent) => void) => {
            return listener === currentListener;
        });
    }

    protected notifyValidityChanged(event: InputValidityChangedEvent) {
        this.inputValidityChangedListeners.forEach((listener: (event: InputValidityChangedEvent) => void) => {
            listener(event);
        });
    }

    hideValidationDetailsByDefault(): boolean {
        return false;
    }

    abstract onValueChanged(listener: (event: ValueChangedEvent) => void);

    refresh() {
        //to be implemented on demand in inheritors
    }

    reset(): void {
        throw Error('Must be implemented in inheritors');
    }

    clear(): void {
        this.previousValidationRecording = null;
        //to be implemented on demand in inheritors
    }

    setEnabled(enable: boolean) {
    //
    }

    abstract unValueChanged(listener: (event: ValueChangedEvent) => void);

    abstract update(propertyArray: PropertyArray, unchangedOnly?: boolean): Q.Promise<void>;

    validate(silent: boolean) {
    //
    }

    getAiConfig(): AiConfig {
        return {
            aiTools: new Set<AiToolType>(),
        }
    }
}
