import {Equitable} from '../Equitable';
import {ObjectHelper} from '../ObjectHelper';
import {FormItemTypeWrapperJson} from './json/FormItemTypeWrapperJson';
import {FormItemSet} from './set/itemset/FormItemSet';
import {FormOptionSet} from './set/optionset/FormOptionSet';
import {FormOptionSetOption} from './set/optionset/FormOptionSetOption';
import {FieldSet} from './set/fieldset/FieldSet';
import {FormItemPath, FormItemPathElement} from './FormItemPath';
import {Input} from './Input';

export class FormItem
    implements Equitable {

    private name: string;

    private parent: FormItem;

    constructor(name: string) {
        this.name = name;
    }

    public static formItemsToJson(formItems: FormItem[]): FormItemTypeWrapperJson[] {

        let formItemArray: FormItemTypeWrapperJson[] = [];
        formItems.forEach((formItem: FormItem) => {
            formItemArray.push(formItem.toFormItemJson());
        });
        return formItemArray;
    }

    setParent(parent: FormItem) {
        if (!(ObjectHelper.iFrameSafeInstanceOf(parent, FormItemSet) ||
              ObjectHelper.iFrameSafeInstanceOf(parent, FieldSet) ||
              ObjectHelper.iFrameSafeInstanceOf(parent, FormOptionSet) ||
              ObjectHelper.iFrameSafeInstanceOf(parent, FormOptionSetOption))) {
            throw new Error('A parent FormItem must either be a FormItemSet, FieldSet or a FormOptionSet');
        }

        this.parent = parent;
    }

    getName(): string {
        return this.name;
    }

    getPath(): FormItemPath {
        return this.resolvePath();
    }

    getParent(): FormItem {
        return this.parent;
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, FormItem)) {
            return false;
        }

        let other = <FormItem>o;

        if (!ObjectHelper.stringEquals(this.name, other.name)) {
            return false;
        }

        return true;
    }

    public toFormItemJson(): FormItemTypeWrapperJson {

        if (ObjectHelper.iFrameSafeInstanceOf(this, Input)) {
            return (<Input><any>this).toInputJson();
        } else if (ObjectHelper.iFrameSafeInstanceOf(this, FormItemSet)) {
            return (<FormItemSet><any>this).toFormItemSetJson();
        } else if (ObjectHelper.iFrameSafeInstanceOf(this, FieldSet)) {
            return (<FieldSet><any>this).toFieldSetJson();
        } else if (ObjectHelper.iFrameSafeInstanceOf(this, FormOptionSet)) {
            return (<FormOptionSet><any>this).toFormOptionSetJson();
        } else if (ObjectHelper.iFrameSafeInstanceOf(this, FormOptionSetOption)) {
            return (<FormOptionSetOption><any>this).toFormOptionSetOptionJson();
        } else {
            throw new Error('Unsupported FormItem: ' + this);
        }
    }

    private resolvePath(): FormItemPath {
        return FormItemPath.fromParent(this.resolveParentPath(), FormItemPathElement.fromString(this.name));
    }

    private resolveParentPath(): FormItemPath {

        if (this.parent == null) {
            return FormItemPath.ROOT;
        } else {
            return this.parent.getPath();
        }
    }
}
