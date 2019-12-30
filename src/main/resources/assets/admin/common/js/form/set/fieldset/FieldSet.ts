import {FieldSetJson} from '../../json/FieldSetJson';
import {FormItemTypeWrapperJson} from '../../json/FormItemTypeWrapperJson';
import {Equitable} from '../../../Equitable';
import {ObjectHelper} from '../../../ObjectHelper';
import {FormItem} from '../../FormItem';
import {FormItemContainer} from '../../FormItemContainer';
import {FormItemFactory} from '../../FormItemFactoryImpl';

export class FieldSet
    extends FormItem
    implements FormItemContainer {

    private label: string;

    private formItems: FormItem[] = [];

    constructor(fieldSetJson: FieldSetJson, factory: FormItemFactory) {
        super(fieldSetJson.name);
        this.label = fieldSetJson.label;

        if (fieldSetJson.items != null) {
            fieldSetJson.items.forEach((formItemJson) => {
                let formItem = factory.createFormItem(formItemJson);
                if (formItem) {
                    this.addFormItem(formItem);
                }
            });
        }
    }

    addFormItem(formItem: FormItem) {
        this.formItems.push(formItem);
    }

    getLabel(): string {
        return this.label;
    }

    getFormItems(): FormItem[] {
        return this.formItems;
    }

    public toJson(): FormItemTypeWrapperJson {

        return {
            FieldSet: {
                name: this.getName(),
                items: this.getFormItems().map(formItem => formItem.toJson()),
                label: this.getLabel()
            }
        };
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, FieldSet)) {
            return false;
        }

        if (!super.equals(o)) {
            return false;
        }

        let other = <FieldSet>o;

        if (!ObjectHelper.stringEquals(this.label, other.label)) {
            return false;
        }

        if (!ObjectHelper.arrayEquals(this.formItems, other.formItems)) {
            return false;
        }

        return true;
    }
}
