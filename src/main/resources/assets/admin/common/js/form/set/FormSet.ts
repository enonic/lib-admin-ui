import {FormSetJson} from '../json/FormSetJson';
import {Equitable} from '../../Equitable';
import {ObjectHelper} from '../../ObjectHelper';
import {FormItem} from '../FormItem';
import {Occurrences} from '../Occurrences';
import {FormItemTypeWrapperJson} from '../json/FormItemTypeWrapperJson';

/**
 * A parent for [[FormItemSet]] and [[FormOptionSet]].
 */
export class FormSet
    extends FormItem {

    private label: string;

    private occurrences: Occurrences;

    private helpText: string;

    private helpTextIsOn: boolean = false;

    constructor(formSetJson: FormSetJson) {
        super(formSetJson.name);
        this.label = formSetJson.label;
        this.occurrences = Occurrences.fromJson(formSetJson.occurrences);
        this.helpText = formSetJson.helpText;
    }

    getLabel(): string {
        return this.label;
    }

    getHelpText(): string {
        return this.helpText;
    }

    getOccurrences(): Occurrences {
        return this.occurrences;
    }

    isHelpTextOn(): boolean {
        return this.helpTextIsOn;
    }

    toggleHelpText(show?: boolean) {
        this.helpTextIsOn = show;
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, FormSet)) {
            return false;
        }

        if (!super.equals(o)) {
            return false;
        }

        let other = o as FormSet;

        if (!ObjectHelper.stringEquals(this.label, other.label)) {
            return false;
        }

        if (!ObjectHelper.equals(this.occurrences, other.occurrences)) {
            return false;
        }

        if (!ObjectHelper.stringEquals(this.helpText, other.helpText)) {
            return false;
        }

        return true;
    }

    toJson(): FormItemTypeWrapperJson {
        return {};
    }

}
