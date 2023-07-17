import {Equitable} from '../Equitable';
import {Form} from '../form/Form';
import {MacroJson} from './MacrosJson';
import {ObjectHelper} from '../ObjectHelper';
import {MacroKey} from './MacroKey';

export class MacroDescriptor
    implements Equitable {

    private macroKey: MacroKey;

    private displayName: string;

    private description: string;

    private form: Form;

    private iconUrl: string;

    constructor(builder: MacroDescriptorBuilder) {
        this.macroKey = builder.macroKey;
        this.displayName = builder.displayName;
        this.description = builder.description;
        this.form = builder.form;
        this.iconUrl = builder.iconUrl;
    }

    static create(): MacroDescriptorBuilder {
        return new MacroDescriptorBuilder();
    }

    static fromJson(json: MacroJson): MacroDescriptor {
        return MacroDescriptor.create()
            .setKey(MacroKey.fromString(json.key))
            .setDisplayName(json.displayName)
            .setDescription(json.description)
            .setForm(json.form != null ? Form.fromJson(json.form) : null)
            .setIconUrl(json.iconUrl)
            .build();
    }

    getKey(): MacroKey {
        return this.macroKey;
    }

    getName(): string {
        return this.macroKey.getName();
    }

    getDisplayName(): string {
        return this.displayName;
    }

    getDescription(): string {
        return this.description;
    }

    getForm(): Form {
        return this.form;
    }

    getIconUrl(): string {
        return this.iconUrl;
    }

    equals(o: Equitable): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(o, MacroDescriptor)) {
            return false;
        }

        let other = o as MacroDescriptor;

        if (this.displayName !== other.displayName) {
            return false;
        }

        if (this.description !== other.description) {
            return false;
        }

        if (this.iconUrl !== other.iconUrl) {
            return false;
        }

        if (!ObjectHelper.equals(this.macroKey, other.macroKey)) {
            return false;
        }

        if (!ObjectHelper.equals(this.form, other.form)) {
            return false;
        }

        return true;
    }
}

export class MacroDescriptorBuilder {

    macroKey: MacroKey;

    displayName: string;

    description: string;

    form: Form;

    iconUrl: string;

    fromSource(source: MacroDescriptor): MacroDescriptorBuilder {
        this.macroKey = source.getKey();
        this.displayName = source.getDisplayName();
        this.description = source.getDescription();
        this.form = source.getForm();
        this.iconUrl = source.getIconUrl();
        return this;
    }

    setKey(key: MacroKey): MacroDescriptorBuilder {
        this.macroKey = key;
        return this;
    }

    setDisplayName(displayName: string): MacroDescriptorBuilder {
        this.displayName = displayName;
        return this;
    }

    setDescription(description: string): MacroDescriptorBuilder {
        this.description = description;
        return this;
    }

    setForm(form: Form): MacroDescriptorBuilder {
        this.form = form;
        return this;
    }

    setIconUrl(iconUrl: string): MacroDescriptorBuilder {
        this.iconUrl = iconUrl;
        return this;
    }

    build(): MacroDescriptor {
        return new MacroDescriptor(this);
    }
}
