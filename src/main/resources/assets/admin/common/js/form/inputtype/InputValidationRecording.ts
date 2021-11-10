import {Equitable} from '../../Equitable';
import {Occurrences} from '../Occurrences';
import {StringHelper} from '../../util/StringHelper';

export class InputValidationRecording
    implements Equitable {

    private readonly occurrences: Occurrences;

    private readonly totalValid: number;

    private validationErrorToBeRendered: boolean;

    private validationMessageToBeRendered: boolean;

    private errorMessage: string;

    private toggleErrorDetailsCallback: () => void;

    constructor(occurrences: Occurrences, totalValid: number) {
        this.occurrences = occurrences;
        this.totalValid = totalValid;
        this.validationErrorToBeRendered = true;
        this.validationMessageToBeRendered = true;
    }

    isValid(): boolean {
        return !this.errorMessage && this.totalValid >= this.occurrences.getMinimum() &&
               !this.occurrences.maximumBreached(this.totalValid);
    }

    getOccurrences(): Occurrences {
        return this.occurrences;
    }

    isMinimumOccurrencesBreached(): boolean {
        return this.totalValid < this.occurrences.getMinimum();
    }

    isMaximumOccurrencesBreached(): boolean {
        return this.occurrences.maximumBreached(this.totalValid);
    }

    setValidationErrorToBeRendered(value: boolean) {
        this.validationErrorToBeRendered = value;
    }

    isValidationErrorToBeRendered(): boolean {
        return this.validationErrorToBeRendered;
    }

    setValidationMessageToBeRendered(value: boolean) {
        this.validationMessageToBeRendered = value;
    }

    isValidationMessageToBeRendered(): boolean {
        return this.validationMessageToBeRendered;
    }

    setErrorMessage(value: string): void {
        this.errorMessage = value;
    }

    hasErrorMessage(): boolean {
        return !StringHelper.isBlank(this.errorMessage);
    }

    getErrorMessage(): string {
        return this.errorMessage;
    }

    equals(that: InputValidationRecording): boolean {
        return this.isValid() === that.isValid();
    }

    validityChanged(other: InputValidationRecording) {
        return other == null || other == null || !other.equals(this);
    }

    setToggleErrorDetailsCallback(callbackFn: () => void) {
        return this.toggleErrorDetailsCallback = callbackFn;
    }

    getToggleErrorDetailsCallback(): () => void {
        return this.toggleErrorDetailsCallback;
    }

    hasToggleErrorDetailsCallback(): boolean {
        return !!this.toggleErrorDetailsCallback;
    }
}
