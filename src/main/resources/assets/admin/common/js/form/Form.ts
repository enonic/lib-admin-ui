import {Form, type FormItem} from '@enonic/input-types/schema';

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

    build(): Form {
        return new Form(this.formItems);
    }
}
