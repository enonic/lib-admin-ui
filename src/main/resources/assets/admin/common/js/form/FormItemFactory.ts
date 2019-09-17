import {FormJson} from './json/FormJson';
import {FormItemTypeWrapperJson} from './json/FormItemTypeWrapperJson';
import {InputJson} from './json/InputJson';
import {FormItemSetJson} from './json/FormItemSetJson';
import {FieldSetJson} from './json/FieldSetJson';
import {FormOptionSetJson} from './json/FormOptionSetJson';
import {FormOptionSetOptionJson} from './json/FormOptionSetOptionJson';
import {FormItemSet} from './set/itemset/FormItemSet';
import {FormOptionSet} from './set/optionset/FormOptionSet';
import {FormOptionSetOption} from './set/optionset/FormOptionSetOption';
import {Form} from './Form';
import {FormItem} from './FormItem';
import {Input} from './Input';
import {FieldSet} from './set/fieldset/FieldSet';

export class FormItemFactory {

    static createForm(formJson: FormJson): Form {
        return Form.fromJson(formJson);
    }

    static createFormItem(formItemTypeWrapperJson: FormItemTypeWrapperJson): FormItem {

        if (formItemTypeWrapperJson.Input) {
            return FormItemFactory.createInput(formItemTypeWrapperJson.Input);
        } else if (formItemTypeWrapperJson.FormItemSet) {
            return FormItemFactory.createFormItemSet(formItemTypeWrapperJson.FormItemSet);
        } else if (formItemTypeWrapperJson.FieldSet) {
            return FormItemFactory.createFieldSetLayout(formItemTypeWrapperJson.FieldSet);
        } else if (formItemTypeWrapperJson.FormOptionSet) {
            return FormItemFactory.createFormOptionSet(formItemTypeWrapperJson.FormOptionSet);
        } else if (formItemTypeWrapperJson.FormOptionSetOption) {
            return FormItemFactory.createFormOptionSetOption(formItemTypeWrapperJson.FormOptionSetOption);
        }

        console.error('Unknown FormItem type: ', formItemTypeWrapperJson);
        return null;
    }

    static createInput(inputJson: InputJson): Input {
        return Input.fromJson(inputJson);
    }

    static createFormItemSet(formItemSetJson: FormItemSetJson): FormItemSet {
        return new FormItemSet(formItemSetJson);
    }

    static createFieldSetLayout(fieldSetJson: FieldSetJson): FieldSet {
        return new FieldSet(fieldSetJson);
    }

    static createFormOptionSet(optionSetJson: FormOptionSetJson): FormOptionSet {
        return new FormOptionSet(optionSetJson);
    }

    static createFormOptionSetOption(optionSetOptionJson: FormOptionSetOptionJson): FormOptionSetOption {
        return new FormOptionSetOption(optionSetOptionJson);
    }
}
