import {FormItemTypeWrapperJson} from './json/FormItemTypeWrapperJson';
import {InputJson} from './json/InputJson';
import {FormItemSetJson} from './json/FormItemSetJson';
import {FieldSetJson} from './json/FieldSetJson';
import {FormOptionSetJson} from './json/FormOptionSetJson';
import {FormOptionSetOptionJson} from './json/FormOptionSetOptionJson';
import {FormItemSet} from './set/itemset/FormItemSet';
import {FormOptionSet} from './set/optionset/FormOptionSet';
import {FormOptionSetOption} from './set/optionset/FormOptionSetOption';
import {FormItem} from './FormItem';
import {Input} from './Input';
import {FieldSet} from './set/fieldset/FieldSet';
import {Store} from '../store/Store';
import {ApplicationKey} from '../application/ApplicationKey';

export const FORM_ITEM_FACTORY_KEY: string = 'FormItemFactory';

export interface FormItemFactory {
    createFormItem(formItemTypeWrapperJson: FormItemTypeWrapperJson, applicationKey?: ApplicationKey): FormItem;
}

export class FormItemFactoryImpl
    implements FormItemFactory {

    private constructor() {
    }

    static get(): FormItemFactoryImpl {
        let instance: FormItemFactoryImpl = Store.parentInstance().get(FORM_ITEM_FACTORY_KEY);

        if (instance == null) {
            instance = new FormItemFactoryImpl();
            Store.parentInstance().set(FORM_ITEM_FACTORY_KEY, instance);
        }

        return instance;
    }

    createFormItem(formItemTypeWrapperJson: FormItemTypeWrapperJson, applicationKey?: ApplicationKey): FormItem {

        if (formItemTypeWrapperJson.Input) {
            return this.createInput(formItemTypeWrapperJson.Input).setApplicationKey(applicationKey);
        } else if (formItemTypeWrapperJson.FormItemSet) {
            return this.createFormItemSet(formItemTypeWrapperJson.FormItemSet, applicationKey);
        } else if (formItemTypeWrapperJson.FieldSet) {
            return this.createFieldSetLayout(formItemTypeWrapperJson.FieldSet, applicationKey);
        } else if (formItemTypeWrapperJson.FormOptionSet) {
            return this.createFormOptionSet(formItemTypeWrapperJson.FormOptionSet, applicationKey);
        } else if (formItemTypeWrapperJson.FormOptionSetOption) {
            return this.createFormOptionSetOption(formItemTypeWrapperJson.FormOptionSetOption, applicationKey);
        }

        console.error('Unknown FormItem type: ', formItemTypeWrapperJson);
        return null;
    }

    private createInput(inputJson: InputJson): Input {
        return Input.fromJson(inputJson);
    }

    private createFormItemSet(formItemSetJson: FormItemSetJson, applicationKey?: ApplicationKey): FormItemSet {
        return new FormItemSet(formItemSetJson, this, applicationKey);
    }

    private createFieldSetLayout(fieldSetJson: FieldSetJson, applicationKey?: ApplicationKey): FieldSet {
        return new FieldSet(fieldSetJson, this, applicationKey);
    }

    private createFormOptionSet(optionSetJson: FormOptionSetJson, applicationKey?: ApplicationKey): FormOptionSet {
        return new FormOptionSet(optionSetJson, this, applicationKey);
    }

    private createFormOptionSetOption(optionSetOptionJson: FormOptionSetOptionJson, applicationKey?: ApplicationKey): FormOptionSetOption {
        return new FormOptionSetOption(optionSetOptionJson, this, applicationKey);
    }
}
