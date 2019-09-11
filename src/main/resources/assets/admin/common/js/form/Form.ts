import {Equitable} from '../Equitable';
import {FormJson} from './json/FormJson';
import {ObjectHelper} from '../ObjectHelper';
import {FormItem} from './FormItem';
import {FormItemFactory} from './FormItemFactory';
import {FormItemContainer} from './FormItemContainer';
import {Input} from './Input';

export class FormBuilder {

    formItems: FormItem[] = [];

    addFormItem(formItem: FormItem): FormBuilder {
        this.formItems.push(formItem);
        return this;
    }

    addFormItems(formItems: FormItem[]): FormBuilder {
        formItems.forEach((formItem: FormItem) => {
            this.addFormItem(formItem);
        });
        return this;
    }

    fromJson(json: FormJson): FormBuilder {
        json.formItems.forEach((formItemJson) => {
            let formItem: FormItem = FormItemFactory.createFormItem(formItemJson);
            if (formItem) {
                this.addFormItem(formItem);
            }
        });
        return this;
    }

    build(): Form {
        return new Form(this);
    }
}

/**
 * A form consist of [[FormItem]]s.
 *
 * A [[FormItem]] can either be a [[Input]], [[FormItemSet]] or a [[FieldSet]]:
 * * A [[Input]] gives the user the possibility input one or more values.
 * * A [[FormItemSet]] groups a set of [[FormItem]]s, both visually and the data.
 * * A [[FieldSet]] is a [[Layout]] which only visually groups [[FormItem]]s.
 */
export class Form
    implements Equitable, FormItemContainer {

    private formItems: FormItem[] = [];

    private formItemByName: { [name: string]: FormItem; } = {};

    constructor(builder: FormBuilder) {
        builder.formItems.forEach((formItem: FormItem) => {
            this.addFormItem(formItem);
        });
    }

    static fromJson(json: FormJson): Form {
        let builder: FormBuilder = new FormBuilder();
        builder.fromJson(json);
        return builder.build();
    }

    addFormItem(formItem: FormItem): void {
        const name: string = formItem.getName();
        if (this.formItemByName[name]) {
            throw new Error('FormItem already added: ' + name);
        }
        this.formItemByName[formItem.getName()] = formItem;
        this.formItems.push(formItem);
    }

    getFormItems(): FormItem[] {
        return this.formItems;
    }

    getFormItemByName(name: string): FormItem {
        return this.formItemByName[name];
    }

    getInputByName(name: string): Input {
        return <Input>this.formItemByName[name];
    }

    toJson(): FormJson {

        return <FormJson>{
            formItems: FormItem.formItemsToJson(this.getFormItems())
        };
    }

    equals(o: Equitable): boolean {

        if (!(ObjectHelper.iFrameSafeInstanceOf(o, Form))) {
            return false;
        }

        let other: Form = <Form>o;

        if (this.formItems.length !== other.formItems.length) {
            return false;
        }

        for (let i: number = 0; i < this.formItems.length; i++) {
            if (!this.formItems[i].equals(other.formItems[i])) {
                return false;
            }
        }

        return true;
    }
}
