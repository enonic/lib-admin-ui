import {Form as ToolkitForm, type FormItem, formItemsFromJson} from '@enonic/input-types/schema';
import type {FormJson as XpFormJson} from '@enonic/ui-types';
import {ApplicationKey} from '../application/ApplicationKey';
import {FormItemFactoryImpl} from './FormItemFactoryImpl';
import {FormItemTypeWrapperJson} from './json/FormItemTypeWrapperJson';
import {FormJson} from './json/FormJson';

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

    protected createFormItem(formItemJson: FormItemTypeWrapperJson, applicationKey?: ApplicationKey): FormItem {
        return FormItemFactoryImpl.get().createFormItem(formItemJson, applicationKey);
    }

    fromJson(json: FormJson, applicationKey?: ApplicationKey): FormBuilder {
        json.formItems.forEach((formItemJson: FormItemTypeWrapperJson) => {
            const formItem: FormItem = this.createFormItem(formItemJson, applicationKey);
            if (formItem) {
                this.addFormItem(formItem);
            }
        });
        return this;
    }

    build(): Form {
        return new Form(this.formItems);
    }
}

/**
 * The toolkit's `Form`, reading this library's form JSON too: Content Studio's REST wraps every
 * item in a key (`{Input: {…}}`) where XP's own libraries say `formItemType`, and both arrive here.
 */
export class Form
    extends ToolkitForm {

    static override fromJson(json: FormJson | XpFormJson, applicationKey?: ApplicationKey | string): Form {
        const key = applicationKey instanceof ApplicationKey ? applicationKey.toString() : applicationKey;
        if ('formItems' in json) {
            return new FormBuilder().fromJson(json, key == null ? undefined : ApplicationKey.fromString(key)).build();
        }
        return new Form(formItemsFromJson(json, key));
    }
}
