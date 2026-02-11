import Q from 'q';
import {PropertyArray} from '../../data/PropertyArray';
import {Value} from '../../data/Value';
import {ValueType} from '../../data/ValueType';
import {Element} from '../../dom/Element';
import {Input} from '../Input';
import {AiConfig} from './InputAiConfig';
import {InputValidationRecording} from './InputValidationRecording';
import {InputValidityChangedEvent} from './InputValidityChangedEvent';
import {ValueChangedEvent} from './ValueChangedEvent';


export interface InputTypeView {

    getValueType(): ValueType;

    getElement(): Element;

    layout(input: Input, propertyArray: PropertyArray): Q.Promise<void>;

    update(propertyArray: PropertyArray, unchangedOnly?: boolean): Q.Promise<void>;

    reset(): void;

    clear(): void;

    refresh();

    setEnabled(enable: boolean);

    newInitialValue(): Value;

    getDefaultValue(): Value;

    getRawDefaultValue(): unknown;

    createDefaultValue(raw: unknown): Value;

    /*
     * Whether the InputTypeView it self is managing adding new occurrences or not.
     * If false, then this is expected to implement interface InputTypeViewNotManagingOccurrences.
     */
    isManagingAdd(): boolean;

    /*
     * Returns true if focus was successfully given.
     */
    giveFocus(): boolean;

    displayValidationErrors();

    hasValidUserInput(): boolean;

    validate(silent: boolean);

    getInputValidationRecording(): InputValidationRecording;

    hideValidationDetailsByDefault(): boolean;

    isValidationErrorToBeRendered(): boolean;

    getAiConfig(): AiConfig;

    onValidityChanged(listener: (event: InputValidityChangedEvent) => void);

    unValidityChanged(listener: (event: InputValidityChangedEvent) => void);

    onValueChanged(listener: (event: ValueChangedEvent) => void);

    unValueChanged(listener: (event: ValueChangedEvent) => void);

    availableSizeChanged();

    onFocus(listener: (event: FocusEvent) => void);

    unFocus(listener: (event: FocusEvent) => void);

    onBlur(listener: (event: FocusEvent) => void);

    unBlur(listener: (event: FocusEvent) => void);

}
