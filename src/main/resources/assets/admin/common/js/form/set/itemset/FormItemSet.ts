import {FormItemSetJson} from '../../json/FormItemSetJson';
import {FormItemTypeWrapperJson} from '../../json/FormItemTypeWrapperJson';
import {Equitable} from '../../../Equitable';
import {ObjectHelper} from '../../../ObjectHelper';
import {FormSet} from '../FormSet';
import {FormItemContainer} from '../../FormItemContainer';
import {FormItem} from '../../FormItem';
import {FormItemFactory} from '../../FormItemFactoryImpl';
import {Input} from '../../Input';
import {ApplicationKey} from '../../../application/ApplicationKey';

/**
 * A set of [[FormItem]]s.
 *
 * The form items are kept in the order they where inserted.
 */
export class FormItemSet
    extends FormSet
    implements FormItemContainer {

    private formItems: FormItem[] = [];

    private formItemByName: Record<string, FormItem> = {};

    private immutable: boolean;

    constructor(formItemSetJson: FormItemSetJson, factory: FormItemFactory, applicationKey?: ApplicationKey) {
        super(formItemSetJson);
        this.immutable = formItemSetJson.immutable;

        if (formItemSetJson.items != null) {
            formItemSetJson.items.forEach((formItemJson) => {
                let formItem: FormItem = factory.createFormItem(formItemJson, applicationKey);
                if (formItem) {
                    this.addFormItem(formItem);
                }
            });
        }
    }

    addFormItem(formItem: FormItem): void {
        const name: string = formItem.getName();
        if (this.formItemByName[name]) {
            throw new Error('FormItem already added: ' + name);
        }
        formItem.setParent(this);
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
        return this.formItemByName[name] as Input;
    }

    isImmutable(): boolean {
        return this.immutable;
    }

    public toJson(): FormItemTypeWrapperJson {

        return {
            FormItemSet: {
                name: this.getName(),
                helpText: this.getHelpText(),
                immutable: this.isImmutable(),
                items: this.getFormItems().map(formItem => formItem.toJson()),
                label: this.getLabel(),
                occurrences: this.getOccurrences().toJson()
            }
        };
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, FormItemSet)) {
            return false;
        }

        if (!super.equals(o)) {
            return false;
        }

        let other: FormItemSet = o as FormItemSet;

        if (!ObjectHelper.booleanEquals(this.immutable, other.immutable)) {
            return false;
        }

        if (!ObjectHelper.arrayEquals(this.formItems, other.formItems)) {
            return false;
        }

        return true;
    }

}
