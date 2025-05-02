import {Equitable} from '../../Equitable';
import {Occurrences} from '../Occurrences';
import {StringHelper} from '../../util/StringHelper';

export class InputValidationRecording
    implements Equitable {

    private readonly occurrences: Occurrences;

    private readonly totalValid: number;

    private errorMessage: string;

    constructor(occurrences: Occurrences, totalValid: number) {
        this.occurrences = occurrences;
        this.totalValid = totalValid;
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
        if (!that) {
            return false;
        }

        return this.isValid() === that.isValid() && this.errorMessage == that.errorMessage;
    }

    validityChanged(other: InputValidationRecording) {
        return !other ? true : !this.equals(other);
    }
}
