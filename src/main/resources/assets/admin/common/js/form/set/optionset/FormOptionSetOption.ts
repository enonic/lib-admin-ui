import {FormOptionSetOptionJson} from '../../json/FormOptionSetOptionJson';
import {Equitable} from '../../../Equitable';
import {FormItem} from '../../FormItem';
import {FormItemTypeWrapperJson} from '../../json/FormItemTypeWrapperJson';
import {ObjectHelper} from '../../../ObjectHelper';
import {FormItemContainer} from '../../FormItemContainer';
import {FormItemFactory} from '../../FormItemFactoryImpl';
import {ApplicationKey} from '../../../application/ApplicationKey';

export class FormOptionSetOption
    extends FormItem
    implements FormItemContainer, Equitable {

    private label: string;

    private defaultOption: boolean;

    private formItems: FormItem[] = [];

    private helpText: string;

    private helpTextIsOn: boolean = false;

    private formItemByName: Record<string, FormItem> = {};

    constructor(optionJson: FormOptionSetOptionJson, factory: FormItemFactory, applicationKey?: ApplicationKey) {
        super(optionJson.name);
        this.label = optionJson.label;
        this.defaultOption = optionJson.defaultOption;
        this.helpText = optionJson.helpText;
        if (optionJson.items != null) {
            optionJson.items.forEach((formItemJson) => {
                let formItem: FormItem = factory.createFormItem(formItemJson, applicationKey);
                if (formItem) {
                    this.addFormItem(formItem);
                }
            });
        }
    }

    public static optionsToJson(options: FormOptionSetOption[]): FormOptionSetOptionJson[] {
        let jsonArray: FormOptionSetOptionJson[] = [];
        options.forEach((option: FormOptionSetOption) => {
            jsonArray.push(option.toJson().FormOptionSetOption);
        });
        return jsonArray;
    }

    addFormItem(formItem: FormItem): void {
        const name: string = formItem.getName();
        if (this.formItemByName[name]) {
            throw new Error(`FormItem already added: ${name}`);
        }
        formItem.setParent(this);
        this.formItemByName[formItem.getName()] = formItem;
        this.formItems.push(formItem);
    }

    getFormItems(): FormItem[] {
        return this.formItems;
    }

    toString(): string {
        return this.label;
    }

    getLabel(): string {
        return this.label;
    }

    isDefaultOption(): boolean {
        return this.defaultOption;
    }

    getHelpText(): string {
        return this.helpText;
    }

    isHelpTextOn(): boolean {
        return this.helpTextIsOn;
    }

    public toJson(): FormItemTypeWrapperJson {

        return {
            FormOptionSetOption: {
                name: this.getName(),
                label: this.getLabel(),
                helpText: this.getHelpText(),
                defaultOption: this.isDefaultOption(),
                items: this.getFormItems().map(formItem => formItem.toJson())
            }
        };
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, FormOptionSetOption)) {
            return false;
        }

        if (!super.equals(o)) {
            return false;
        }

        const other: FormOptionSetOption = o as FormOptionSetOption;

        if (!ObjectHelper.stringEquals(this.label, other.label)) {
            return false;
        }

        if (!ObjectHelper.booleanEquals(this.defaultOption, other.defaultOption)) {
            return false;
        }

        if (!ObjectHelper.arrayEquals(this.formItems, other.formItems)) {
            return false;
        }

        return true;
    }
}
