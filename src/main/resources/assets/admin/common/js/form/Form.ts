// Deprecated re-exports of the toolkit, removed in 7.0 (#4713): import from the package named below instead.
import {Form, type FormItem} from '@enonic/input-types/schema';

export {
    /** @deprecated Import from '@enonic/input-types/schema'. */
    Form,
};

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
