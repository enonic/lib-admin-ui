export class AdditionalValidationRecord {

    private readonly message: string;

    private readonly custom: boolean;

    constructor(builder: Builder) {
        this.message = builder.message;
        this.custom = builder.custom || false;
    }

    public static create(): Builder {
        return new Builder();
    }

    getMessage(): string {
        return this.message;
    }

    isCustom(): boolean {
        return this.custom;
    }

    equals(that: AdditionalValidationRecord): boolean {
        return this.message === that.message && this.custom === that.custom;
    }
}

export class Builder {
    message: string;

    custom: boolean;

    setMessage(value: string): Builder {
        this.message = value;
        return this;
    }

    setCustom(value: boolean): Builder {
        this.custom = value;
        return this;
    }

    build(): AdditionalValidationRecord {
        return new AdditionalValidationRecord(this);
    }
}
