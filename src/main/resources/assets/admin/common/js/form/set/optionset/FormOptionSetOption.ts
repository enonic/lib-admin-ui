import {FormOptionSetOptionJson} from '../../json/FormOptionSetOptionJson';
import {Equitable} from '../../../Equitable';
import {FormItem} from '../../FormItem';
import {FormItemTypeWrapperJson} from '../../json/FormItemTypeWrapperJson';
import {ObjectHelper} from '../../../ObjectHelper';
import {FormItemContainer} from '../../FormItemContainer';
import {FormItemFactory} from '../../FormItemFactory';

export class FormOptionSetOption
    extends FormItem
    implements FormItemContainer, Equitable {

    private label: string;

    private defaultOption: boolean;

    private formItems: FormItem[] = [];

    private helpText: string;

    private helpTextIsOn: boolean = false;

    private formItemByName: { [name: string]: FormItem; } = {};

    constructor(optionJson: FormOptionSetOptionJson) {
        super(optionJson.name);
        this.label = optionJson.label;
        this.defaultOption = optionJson.defaultOption;
        this.helpText = optionJson.helpText;
        if (optionJson.items != null) {
            optionJson.items.forEach((formItemJson) => {
                let formItem: FormItem = FormItemFactory.createFormItem(formItemJson);
                if (formItem) {
                    this.addFormItem(formItem);
                }
            });
        }
    }

    public static fromJson(optionJson: FormOptionSetOptionJson): FormOptionSetOption {
        return new FormOptionSetOption(optionJson);
    }

    public static optionsToJson(options: FormOptionSetOption[]): FormOptionSetOptionJson[] {
        let jsonArray: FormOptionSetOptionJson[] = [];
        options.forEach((option: FormOptionSetOption) => {
            jsonArray.push(option.toFormOptionSetOptionJson().FormOptionSetOption);
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

    public toFormOptionSetOptionJson(): FormItemTypeWrapperJson {

        return <FormItemTypeWrapperJson>{
            FormOptionSetOption: <FormOptionSetOptionJson>{
                name: this.getName(),
                label: this.getLabel(),
                helpText: this.getHelpText(),
                defaultOption: this.isDefaultOption(),
                items: FormItem.formItemsToJson(this.getFormItems())
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

        const other: FormOptionSetOption = <FormOptionSetOption>o;

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
