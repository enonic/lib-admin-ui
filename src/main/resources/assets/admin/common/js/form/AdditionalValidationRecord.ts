export class AdditionalValidationRecord {

    private message: string;

    constructor(builder: Builder) {
        this.message = builder.message;
    }

    public static create(): Builder {
        return new Builder();
    }

    getMessage(): string {
        return this.message;
    }

    equals(that: AdditionalValidationRecord): boolean {
        if (this.message !== that.message) {
            return false;
        }

        return true;
    }
}

export class Builder {
    message: string;

    setMessage(value: string): Builder {
        this.message = value;
        return this;
    }

    build(): AdditionalValidationRecord {
        return new AdditionalValidationRecord(this);
    }
}
