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

export const FORM_ITEM_FACTORY_KEY: string = 'FormItemFactory';

export interface FormItemFactory {
    createFormItem(formItemTypeWrapperJson: FormItemTypeWrapperJson): FormItem;
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

    createFormItem(formItemTypeWrapperJson: FormItemTypeWrapperJson): FormItem {

        if (formItemTypeWrapperJson.Input) {
            return this.createInput(formItemTypeWrapperJson.Input);
        } else if (formItemTypeWrapperJson.FormItemSet) {
            return this.createFormItemSet(formItemTypeWrapperJson.FormItemSet);
        } else if (formItemTypeWrapperJson.FieldSet) {
            return this.createFieldSetLayout(formItemTypeWrapperJson.FieldSet);
        } else if (formItemTypeWrapperJson.FormOptionSet) {
            return this.createFormOptionSet(formItemTypeWrapperJson.FormOptionSet);
        } else if (formItemTypeWrapperJson.FormOptionSetOption) {
            return this.createFormOptionSetOption(formItemTypeWrapperJson.FormOptionSetOption);
        }

        console.error('Unknown FormItem type: ', formItemTypeWrapperJson);
        return null;
    }

    private createInput(inputJson: InputJson): Input {
        return Input.fromJson(inputJson);
    }

    private createFormItemSet(formItemSetJson: FormItemSetJson): FormItemSet {
        return new FormItemSet(formItemSetJson, this);
    }

    private createFieldSetLayout(fieldSetJson: FieldSetJson): FieldSet {
        return new FieldSet(fieldSetJson, this);
    }

    private createFormOptionSet(optionSetJson: FormOptionSetJson): FormOptionSet {
        return new FormOptionSet(optionSetJson, this);
    }

    private createFormOptionSetOption(optionSetOptionJson: FormOptionSetOptionJson): FormOptionSetOption {
        return new FormOptionSetOption(optionSetOptionJson, this);
    }
}
