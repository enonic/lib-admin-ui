import {Form, type FormItem, formItemsFromJson} from '@enonic/input-types/schema';
import {Schema, SchemaBuilder} from '../Schema';
import {Equitable} from '../../Equitable';
import {ObjectHelper} from '../../ObjectHelper';
import {MixinJson} from './MixinJson';
import {MixinName} from './MixinName';

export class Mixin
    extends Schema
    implements Equitable {

    private schemaKey: string;

    private formItems: FormItem[];

    constructor(builder: MixinBuilder) {
        super(builder);
        this.formItems = builder.formItems;
        this.schemaKey = builder.schemaKey;
    }

    static fromJson(json: MixinJson): Mixin {
        return new MixinBuilder().fromMixinJson(json).build();
    }

    getMixinName(): MixinName {
        return new MixinName(this.getName());
    }

    getFormItems(): FormItem[] {
        return this.formItems;
    }

    getSchemaKey(): string {
        return this.schemaKey;
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, Mixin)) {
            return false;
        }

        if (!super.equals(o)) {
            return false;
        }

        let other = o as Mixin;

        if (!ObjectHelper.stringEquals(this.schemaKey, other.schemaKey)) {
            return false;
        }

        if (!ObjectHelper.arrayEquals(this.formItems, other.formItems)) {
            return false;
        }

        return true;
    }

    toForm(): Form {
        return new Form(this.formItems);
    }

}

export class MixinBuilder
    extends SchemaBuilder {

    schemaKey: string;

    formItems: FormItem[];

    constructor(source?: Mixin) {
        super(source);
        if (source) {
            this.schemaKey = source.getSchemaKey();
            this.formItems = source.getFormItems();
        }
    }

    fromMixinJson(mixinJson: MixinJson): MixinBuilder {

        super.fromSchemaJson(mixinJson);

        this.formItems = mixinJson.form != null ? formItemsFromJson(mixinJson.form) : [];
        this.schemaKey = 'mixin:' + this.name;
        return this;
    }

    build(): Mixin {
        return new Mixin(this);
    }

}
