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

    occurrences: Occurrences;

    helpText: string;

    inputTypeConfig: object;

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

    setOccurrences(value: Occurrences): InputBuilder {
        this.occurrences = value;
        return this;
    }

    setHelpText(value: string): InputBuilder {
        this.helpText = value;
        return this;
    }

    setInputTypeConfig(value: object): InputBuilder {
        this.inputTypeConfig = value;
        return this;
    }

    fromJson(json: InputJson): InputBuilder {
        this.name = json.name;
        this.inputType = InputTypeName.parseInputTypeName(json.inputType);
        this.label = json.label;
        this.occurrences = Occurrences.fromJson(json.occurrences);
        this.helpText = json.helpText;
        this.inputTypeConfig = json.config;
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

    private occurrences: Occurrences;

    private helpText: string;

    private inputTypeConfig: object;

    constructor(builder: InputBuilder) {
        super(builder.name);
        this.inputType = builder.inputType;
        this.inputTypeConfig = builder.inputTypeConfig;
        this.label = builder.label;
        this.occurrences = builder.occurrences;
        this.helpText = builder.helpText;
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

    getOccurrences(): Occurrences {
        return this.occurrences;
    }

    getHelpText(): string {
        return this.helpText;
    }

    getInputTypeConfig(): object {
        return this.inputTypeConfig;
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, Input)) {
            return false;
        }

        if (!super.equals(o)) {
            return false;
        }

        let other = o as Input;

        if (!ObjectHelper.equals(this.inputType, other.inputType)) {
            return false;
        }

        if (!ObjectHelper.stringEquals(this.label, other.label)) {
            return false;
        }

        if (!ObjectHelper.equals(this.occurrences, other.occurrences)) {
            return false;
        }

        if (!ObjectHelper.stringEquals(this.helpText, other.helpText)) {
            return false;
        }

        return ObjectHelper.objectEquals(this.inputTypeConfig, other.inputTypeConfig);
    }

    public toJson(): FormItemTypeWrapperJson {

        return {
            Input: {
                name: this.getName(),
                helpText: this.getHelpText(),
                label: this.getLabel(),
                occurrences: this.getOccurrences().toJson(),
                inputType: this.getInputType().toJson(),
                config: this.getInputTypeConfig(),
            }
        };
    }
}
