import {FormItemSet} from './FormItemSet';
import {FormSetOccurrenceView, FormSetOccurrenceViewConfig} from '../FormSetOccurrenceView';
import {FormItem} from '../../FormItem';
import {PropertyArray} from '../../../data/PropertyArray';
import {AiToolHelper} from '../../../ai/tool/AiToolHelper';
import {AiToolType} from '../../../ai/tool/AiToolType';
import {AiDialogIconTool} from '../../../ai/tool/AiDialogIconTool';

export class FormItemSetOccurrenceView
    extends FormSetOccurrenceView {

    constructor(config: FormSetOccurrenceViewConfig<FormItemSetOccurrenceView>) {
        super('form-item-set-', config);
    }

    protected initListeners(): void {
        super.initListeners();

        const isAiButtonAllowed = this.config.context.getAiTools().has(AiToolType.DIALOG);

        if (isAiButtonAllowed) {
            new AiDialogIconTool({
                group: this.config.context.getName(),
                pathElement: this,
                getPath: () => this.getDataPath(),
                aiButtonContainer: this.label,
            });
        }
    }

    protected getLabelText(): string {
        return this.getFirstPropertyValue() || this.getFormSet().getLabel();
    }

    protected getLabelSubTitle(): string {
        return this.getFirstPropertyValue() ? this.getFormSet().getLabel() : '';
    }

    private getFirstPropertyValue(): string {
        const formItemNames = this.getFormItems().map((formItem: FormItem) => formItem.getName());
        const propArrays =
            this.propertySet.getPropertyArrays().sort((prop1: PropertyArray, prop2: PropertyArray) =>
                        formItemNames.indexOf(prop1.getName()) - formItemNames.indexOf(prop2.getName())
            );
        const propValues = [];

        if (propArrays && propArrays.length > 0) {
            propArrays.some((propArray: PropertyArray) => {
                if ('_selected' === propArray.getName()) {
                    return false;   // skip technical _selected array
                }
                this.fetchPropertyValues(propArray, propValues, true);
                return propValues.length > 0;
            });
        }

        return propValues.length ? propValues.join(', ') : '';
    }

    protected getFormSet(): FormItemSet {
        return this.formSet as FormItemSet;
    }

    protected getFormItems(): FormItem[] {
        return this.getFormSet().getFormItems();
    }
}
