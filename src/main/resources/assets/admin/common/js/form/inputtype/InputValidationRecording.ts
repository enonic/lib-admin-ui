import {Equitable} from '../../Equitable';
import {Occurrences} from '../Occurrences';

export class InputValidationRecording implements Equitable {

    private readonly occurrences: Occurrences;

    private readonly totalValid: number;

    private validationErrorToBeRendered: boolean;

    private validationMessageToBeRendered: boolean;

    private customErrorText: string;

    constructor(occurrences: Occurrences, totalValid: number) {
        this.occurrences = occurrences;
        this.totalValid = totalValid;
        this.validationErrorToBeRendered = true;
        this.validationMessageToBeRendered = true;
    }

    isValid(): boolean {
        return !this.customErrorText && this.totalValid >= this.occurrences.getMinimum() &&
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

    setCustomErrorText(value: string): void {
        this.customErrorText = value;
    }

    hasCustomErrorText(): boolean {
        return !!this.customErrorText;
    }

    getCustomErrorText(): string {
        return this.customErrorText;
    }

    equals(that: InputValidationRecording): boolean {
        return this.isValid() === that.isValid();
    }

    validityChanged(other: InputValidationRecording) {
        return other == null || other == null || !other.equals(this);
    }
}
