import {FieldSet, FormItem, FormItemSet, FormOptionSet, FormOptionSetOption, Input, Occurrences} from '@enonic/input-types/schema';
import type {InputConfigJson} from '@enonic/ui-types';
import {ApplicationKey} from '../application/ApplicationKey';
import {FieldSetJson} from './json/FieldSetJson';
import {FormItemSetJson} from './json/FormItemSetJson';
import {FormItemTypeWrapperJson} from './json/FormItemTypeWrapperJson';
import {FormOptionSetJson} from './json/FormOptionSetJson';
import {FormOptionSetOptionJson} from './json/FormOptionSetOptionJson';
import {InputJson} from './json/InputJson';

export interface FormItemFactory {
    createFormItem(formItemTypeWrapperJson: FormItemTypeWrapperJson, applicationKey?: ApplicationKey): FormItem;
}

// Not cached in the window-global Store: bundles sharing it would reuse a foreign
// factory whose objects fail this bundle's instanceof checks (lib-admin-ui#4588).
let instance: FormItemFactoryImpl;

/**
 * Builds the toolkit's schema classes from Content Studio's form JSON — one wrapper key per item,
 * `multiselection`, `defaultOption` — which is this library's REST dialect and not the toolkit's;
 * the toolkit's `Form.fromJson` reads XP's own `formItemType` dialect.
 */
export class FormItemFactoryImpl
    implements FormItemFactory {

    private constructor() {
    }

    static get(): FormItemFactoryImpl {
        if (instance == null) {
            instance = new FormItemFactoryImpl();
        }

        return instance;
    }

    createFormItem(formItemTypeWrapperJson: FormItemTypeWrapperJson, applicationKey?: ApplicationKey): FormItem {
        const key = applicationKey?.toString();

        if (formItemTypeWrapperJson.Input) {
            return this.createInput(formItemTypeWrapperJson.Input).setApplicationKey(key);
        } else if (formItemTypeWrapperJson.FormItemSet) {
            return this.createFormItemSet(formItemTypeWrapperJson.FormItemSet, applicationKey).setApplicationKey(key);
        } else if (formItemTypeWrapperJson.FieldSet) {
            return this.createFieldSetLayout(formItemTypeWrapperJson.FieldSet, applicationKey).setApplicationKey(key);
        } else if (formItemTypeWrapperJson.FormOptionSet) {
            return this.createFormOptionSet(formItemTypeWrapperJson.FormOptionSet, applicationKey).setApplicationKey(key);
        } else if (formItemTypeWrapperJson.FormOptionSetOption) {
            return this.createFormOptionSetOption(formItemTypeWrapperJson.FormOptionSetOption, applicationKey).setApplicationKey(key);
        }

        console.error('Unknown FormItem type: ', formItemTypeWrapperJson);
        return null;
    }

    createFormItems(items: FormItemTypeWrapperJson[] | undefined, applicationKey?: ApplicationKey): FormItem[] {
        return (items ?? []).map(json => this.createFormItem(json, applicationKey)).filter(item => item != null);
    }

    private createInput(inputJson: InputJson): Input {
        return Input.fromJson({
            formItemType: 'Input',
            name: inputJson.name,
            label: inputJson.label,
            helpText: inputJson.helpText,
            inputType: inputJson.inputType,
            occurrences: inputJson.occurrences,
            config: inputJson.config as InputConfigJson | undefined,
        });
    }

    private createFormItemSet(json: FormItemSetJson, applicationKey?: ApplicationKey): FormItemSet {
        return new FormItemSet({
            name: json.name,
            label: json.label,
            helpText: json.helpText,
            occurrences: Occurrences.fromJson(json.occurrences),
            items: this.createFormItems(json.items, applicationKey),
        });
    }

    private createFieldSetLayout(json: FieldSetJson, applicationKey?: ApplicationKey): FieldSet {
        return new FieldSet({
            name: json.name,
            label: json.label,
            items: this.createFormItems(json.items, applicationKey),
        });
    }

    private createFormOptionSet(json: FormOptionSetJson, applicationKey?: ApplicationKey): FormOptionSet {
        return new FormOptionSet({
            name: json.name,
            label: json.label,
            helpText: json.helpText,
            expanded: json.expanded,
            occurrences: Occurrences.fromJson(json.occurrences),
            multiselection: Occurrences.fromJson(json.multiselection),
            options: (json.options ?? []).map(option => this.createFormOptionSetOption(option, applicationKey)),
        });
    }

    private createFormOptionSetOption(json: FormOptionSetOptionJson, applicationKey?: ApplicationKey): FormOptionSetOption {
        return new FormOptionSetOption({
            name: json.name,
            label: json.label,
            helpText: json.helpText,
            defaultOption: json.defaultOption,
            items: this.createFormItems(json.items, applicationKey),
        }).setApplicationKey(applicationKey?.toString());
    }
}
