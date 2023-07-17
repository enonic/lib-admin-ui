import {FormOptionSetJson} from '../../json/FormOptionSetJson';
import {FormOptionSetOptionJson} from '../../json/FormOptionSetOptionJson';
import {FormItemTypeWrapperJson} from '../../json/FormItemTypeWrapperJson';
import {Equitable} from '../../../Equitable';
import {ObjectHelper} from '../../../ObjectHelper';
import {FormSet} from '../FormSet';
import {FormItemContainer} from '../../FormItemContainer';
import {FormOptionSetOption} from './FormOptionSetOption';
import {Occurrences} from '../../Occurrences';
import {FormItem} from '../../FormItem';
import {FormItemFactory} from '../../FormItemFactoryImpl';
import {ApplicationKey} from '../../../application/ApplicationKey';

export class FormOptionSet
    extends FormSet
    implements FormItemContainer {

    private options: FormOptionSetOption[] = [];

    private expanded: boolean;

    private multiselection: Occurrences;

    constructor(formOptionSetJson: FormOptionSetJson, factory: FormItemFactory, applicationKey?: ApplicationKey) {
        super(formOptionSetJson);
        this.expanded = formOptionSetJson.expanded;
        this.multiselection = Occurrences.fromJson(formOptionSetJson.multiselection);

        if (formOptionSetJson.options != null) {
            formOptionSetJson.options.forEach((formOptionSetOptionJson: FormOptionSetOptionJson) => {
                const json = {FormOptionSetOption: formOptionSetOptionJson};
                const option = factory.createFormItem(json, applicationKey) as FormOptionSetOption;
                if (option) {
                    this.addSetOption(option);
                }
            });
        }
    }

    addSetOption(option: FormOptionSetOption) {
        this.options.push(option);
        option.setParent(this);
    }

    getFormItems(): FormItem[] {
        return this.options;
    }

    getOptions(): FormOptionSetOption[] {
        return this.options;
    }

    isExpanded(): boolean {
        return this.expanded;
    }

    getMultiselection(): Occurrences {
        return this.multiselection;
    }

    isRadioSelection(): boolean {
        return this.multiselection.getMinimum() === 1 && this.multiselection.getMaximum() === 1;
    }

    public toJson(): FormItemTypeWrapperJson {

        return {
            FormOptionSet: {
                name: this.getName(),
                expanded: this.isExpanded(),
                options: FormOptionSetOption.optionsToJson(this.getOptions()),
                label: this.getLabel(),
                helpText: this.getHelpText(),
                occurrences: this.getOccurrences().toJson(),
                multiselection: this.getMultiselection().toJson()
            }
        };
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, FormOptionSet)) {
            return false;
        }

        if (!super.equals(o)) {
            return false;
        }

        let other = o as FormOptionSet;

        if (!ObjectHelper.booleanEquals(this.expanded, other.expanded)) {
            return false;
        }

        if (!ObjectHelper.equals(this.multiselection, other.multiselection)) {
            return false;
        }

        if (!ObjectHelper.arrayEquals(this.options, other.options)) {
            return false;
        }

        return true;
    }
}
