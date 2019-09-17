import {Equitable} from '../Equitable';
import {ObjectHelper} from '../ObjectHelper';
import {FormItemTypeWrapperJson} from './json/FormItemTypeWrapperJson';
import {FormItemSet} from './set/itemset/FormItemSet';
import {FormOptionSet} from './set/optionset/FormOptionSet';
import {FormOptionSetOption} from './set/optionset/FormOptionSetOption';
import {FieldSet} from './set/fieldset/FieldSet';
import {FormItemPath, FormItemPathElement} from './FormItemPath';

export type FormItemParent = FieldSet | FormItemSet | FormOptionSet | FormOptionSetOption;

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
            formItemArray.push(formItem.toJson());
        });
        return formItemArray;
    }

    setParent(parent: FormItemParent) {
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

    public toJson(): FormItemTypeWrapperJson {
        throw new Error('Unsupported FormItem: ' + this);
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
