import {Equitable} from '../Equitable';
import {ObjectHelper} from '../ObjectHelper';
import {FormItemTypeWrapperJson} from './json/FormItemTypeWrapperJson';
import {FormItemSet} from './set/itemset/FormItemSet';
import {FormOptionSet} from './set/optionset/FormOptionSet';
import {FormOptionSetOption} from './set/optionset/FormOptionSetOption';
import {FieldSet} from './set/fieldset/FieldSet';
import {FormItemPath, FormItemPathElement} from './FormItemPath';
import {ApplicationKey} from '../application/ApplicationKey';

export type FormItemParent = FieldSet | FormItemSet | FormOptionSet | FormOptionSetOption;

export abstract class FormItem
    implements Equitable {

    private readonly name: string;

    private parent: FormItem;

    private applicationKey: ApplicationKey;

    protected formItems: FormItem[] = [];

    protected constructor(name: string) {
        this.name = name;
    }

    getFormItems(): FormItem[] {
        return this.formItems;
    }

    setApplicationKey(value: ApplicationKey): FormItem {
        this.applicationKey = value;
        return this;
    }

    getApplicationKey(): ApplicationKey {
        return this.applicationKey;
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

        let other = o as FormItem;

        if (!ObjectHelper.stringEquals(this.name, other.name)) {
            return false;
        }

        return true;
    }

    abstract toJson(): FormItemTypeWrapperJson;

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
