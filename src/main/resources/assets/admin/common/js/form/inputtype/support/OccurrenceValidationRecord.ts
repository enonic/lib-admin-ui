import {AdditionalValidationRecord} from '../../AdditionalValidationRecord';

export class OccurrenceValidationRecord {

    private breaksRequiredContract: boolean = false;

    private additionalValidation: AdditionalValidationRecord[] = [];

    setBreaksRequiredContract(value: boolean) {
        this.breaksRequiredContract = value;
    }

    isRequiredContractBroken(): boolean {
        return this.breaksRequiredContract;
    }

    isValueValid(): boolean {
        return this.additionalValidation.length === 0;
    }

    isValid(): boolean {
        return !this.isRequiredContractBroken() && this.isValueValid();
    }

    getAdditionalValidationRecords(): AdditionalValidationRecord[] {
        return this.additionalValidation;
    }

    addAdditionalValidation(record: AdditionalValidationRecord) {
        this.additionalValidation.push(record);
    }
}
