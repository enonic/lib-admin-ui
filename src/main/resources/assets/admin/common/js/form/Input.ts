import {Value} from '../data/Value';
import {ValueTypes} from '../data/ValueTypes';
import {Equitable} from '../Equitable';
import {InputJson} from './json/InputJson';
import {ObjectHelper} from '../ObjectHelper';
import {FormItemTypeWrapperJson} from './json/FormItemTypeWrapperJson';
import {InputTypeName} from './InputTypeName';
import {Occurrences} from './Occurrences';
import {FormItem} from './FormItem';

export class InputBuilder {

    name: string;

    inputType: InputTypeName;

    label: string;

    immutable: boolean = false;

    occurrences: Occurrences;

    indexed: boolean = true;

    customText: string;

    validationRegex: string;

    helpText: string;

    inputTypeConfig: any;

    maximizeUIInputWidth: boolean;

    defaultValue: Value;

    setName(value: string): InputBuilder {
        this.name = value;
        return this;
    }

    setInputType(value: InputTypeName): InputBuilder {
        this.inputType = value;
        return this;
    }

    setLabel(value: string): InputBuilder {
        this.label = value;
        return this;
    }

    setImmutable(value: boolean): InputBuilder {
        this.immutable = value;
        return this;
    }

    setOccurrences(value: Occurrences): InputBuilder {
        this.occurrences = value;
        return this;
    }

    setIndexed(value: boolean): InputBuilder {
        this.indexed = value;
        return this;
    }

    setCustomText(value: string): InputBuilder {
        this.customText = value;
        return this;
    }

    setValidationRegex(value: string): InputBuilder {
        this.validationRegex = value;
        return this;
    }

    setHelpText(value: string): InputBuilder {
        this.helpText = value;
        return this;
    }

    setInputTypeConfig(value: any): InputBuilder {
        this.inputTypeConfig = value;
        return this;
    }

    setMaximizeUIInputWidth(value: boolean): InputBuilder {
        this.maximizeUIInputWidth = value;
        return this;
    }

    fromJson(json: InputJson): InputBuilder {
        this.name = json.name;
        this.inputType = InputTypeName.parseInputTypeName(json.inputType);
        this.label = json.label;
        this.immutable = json.immutable;
        this.occurrences = Occurrences.fromJson(json.occurrences);
        this.indexed = json.indexed;
        this.customText = json.customText;
        this.validationRegex = json.validationRegexp;
        this.helpText = json.helpText;
        this.inputTypeConfig = json.config;
        this.maximizeUIInputWidth = json.maximizeUIInputWidth;
        if (json.defaultValue) {
            let type = ValueTypes.fromName(json.defaultValue.type);
            this.defaultValue = type.fromJsonValue(json.defaultValue.value);
        }
        return this;
    }

    build(): Input {
        return new Input(this);
    }

}

/**
 * An input is a [[FormItem]] which the user can give input to.
 *
 * An input must be of certain type which using a [[InputTypeName]].
 * All input types must be registered in [[InputTypeManager]] to be used.
 *
 */
export class Input
    extends FormItem
    implements Equitable {

    private inputType: InputTypeName;

    private label: string;

    private immutable: boolean;

    private occurrences: Occurrences;

    private indexed: boolean;

    private customText: string;

    private validationRegex: string;

    private helpText: string;

    private inputTypeConfig: any;

    private maximizeUIInputWidth: boolean;

    private defaultValue: Value;

    constructor(builder: InputBuilder) {
        super(builder.name);
        this.inputType = builder.inputType;
        this.inputTypeConfig = builder.inputTypeConfig;
        this.label = builder.label;
        this.immutable = builder.immutable;
        this.occurrences = builder.occurrences;
        this.indexed = builder.indexed;
        this.customText = builder.customText;
        this.validationRegex = builder.validationRegex;
        this.helpText = builder.helpText;
        this.maximizeUIInputWidth = builder.maximizeUIInputWidth;
        this.defaultValue = builder.defaultValue;
    }

    static fromJson(json: InputJson): Input {
        let builder = new InputBuilder();
        builder.fromJson(json);
        return builder.build();
    }

    getInputType(): InputTypeName {
        return this.inputType;
    }

    getLabel(): string {
        return this.label;
    }

    isImmutable(): boolean {
        return this.immutable;
    }

    getOccurrences(): Occurrences {
        return this.occurrences;
    }

    isIndexed(): boolean {
        return this.indexed;
    }

    isMaximizeUIInputWidth(): boolean {
        return this.maximizeUIInputWidth;
    }

    getCustomText(): string {
        return this.customText;
    }

    getValidationRegex(): string {
        return this.validationRegex;
    }

    getHelpText(): string {
        return this.helpText;
    }

    getInputTypeConfig(): any {
        return this.inputTypeConfig;
    }

    getDefaultValue(): Value {
        return this.defaultValue;
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, Input)) {
            return false;
        }

        if (!super.equals(o)) {
            return false;
        }

        let other = <Input>o;

        if (!ObjectHelper.equals(this.inputType, other.inputType)) {
            return false;
        }

        if (!ObjectHelper.stringEquals(this.label, other.label)) {
            return false;
        }

        if (!ObjectHelper.booleanEquals(this.immutable, other.immutable)) {
            return false;
        }

        if (!ObjectHelper.equals(this.occurrences, other.occurrences)) {
            return false;
        }

        if (!ObjectHelper.booleanEquals(this.indexed, other.indexed)) {
            return false;
        }

        if (!ObjectHelper.stringEquals(this.customText, other.customText)) {
            return false;
        }

        if (!ObjectHelper.stringEquals(this.validationRegex, other.validationRegex)) {
            return false;
        }

        if (!ObjectHelper.stringEquals(this.helpText, other.helpText)) {
            return false;
        }

        if (!ObjectHelper.anyEquals(this.inputTypeConfig, other.inputTypeConfig)) {
            return false;
        }

        return true;
    }

    public toJson(): FormItemTypeWrapperJson {

        return {
            Input: {
                name: this.getName(),
                customText: this.getCustomText(),
                helpText: this.getHelpText(),
                immutable: this.isImmutable(),
                indexed: this.isIndexed(),
                label: this.getLabel(),
                occurrences: this.getOccurrences().toJson(),
                validationRegexp: this.getValidationRegex(),
                inputType: this.getInputType().toJson(),
                config: this.getInputTypeConfig(),
                maximizeUIInputWidth: this.isMaximizeUIInputWidth()
            }
        };
    }
}
