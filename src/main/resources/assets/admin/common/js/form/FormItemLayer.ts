import Q from 'q';
import {PropertyArray} from '../data/PropertyArray';
import {PropertySet} from '../data/PropertySet';
import {DefaultErrorHandler} from '../DefaultErrorHandler';
import {Element} from '../dom/Element';
import {ObjectHelper} from '../ObjectHelper';
import {FocusSwitchEvent} from '../ui/FocusSwitchEvent';
import {FormContext} from './FormContext';
import {FormItem} from './FormItem';
import {FormItemLayerFactory} from './FormItemLayerFactory';
import {FormItemOccurrenceView} from './FormItemOccurrenceView';
import {FormItemState} from './FormItemState';
import {FormItemView} from './FormItemView';
import {Input} from './Input';
import {InputView, InputViewConfig} from './InputView';
import {FieldSet} from './set/fieldset/FieldSet';
import {FieldSetView, FieldSetViewConfig} from './set/fieldset/FieldSetView';
import {FormSetOccurrenceView} from './set/FormSetOccurrenceView';
import {FormItemSet} from './set/itemset/FormItemSet';
import {FormItemSetView} from './set/itemset/FormItemSetView';
import {FormOptionSet} from './set/optionset/FormOptionSet';
import {FormOptionSetOption} from './set/optionset/FormOptionSetOption';
import {FormOptionSetOptionView, FormOptionSetOptionViewConfig} from './set/optionset/FormOptionSetOptionView';
import {FormOptionSetView} from './set/optionset/FormOptionSetView';

export class FormItemLayer {

    public static debug: boolean = false;

    private context: FormContext;

    private formItems: FormItem[];

    private parentEl: Element;

    private formItemViews: FormItemView[] = [];

    private parent: FormItemOccurrenceView;

    private lazyRender: boolean = true;

    private formItemState: FormItemState;

    private readonly formItemLayerFactory: FormItemLayerFactory;

    constructor(context: FormContext, layerFactory: FormItemLayerFactory) {
        this.context = context;
        this.formItemLayerFactory = layerFactory;
    }

    setFormItems(formItems: FormItem[]): FormItemLayer {
        this.formItems = formItems;
        return this;
    }

    hasParentElement(): boolean {
        return !!this.parentEl;
    }

    setParentElement(parentEl: Element): FormItemLayer {
        this.parentEl = parentEl;
        this.appendFormItemViews();
        return this;
    }

    setParent(value: FormItemOccurrenceView): FormItemLayer {
        this.parent = value;
        return this;
    }

    setFormItemState(formItemState: FormItemState): FormItemLayer {
        this.formItemState = formItemState;
        return this;
    }

    private appendFormItemViews(): void {
        if (!this.parentEl) {
            return;
        }
        this.parentEl.appendChildren(...this.formItemViews);
    }

    layout(propertySet: PropertySet, validate: boolean = true): Q.Promise<FormItemView[]> {
        this.formItemViews = [];

        return this.doLayoutPropertySet(propertySet, validate).then(() => {
            this.parentEl?.whenRendered(() => this.appendFormItemViews());

            return Q<FormItemView[]>(this.formItemViews);
        });
    }

    update(propertySet: PropertySet, unchangedOnly?: boolean): Q.Promise<void> {
        if (FormItemLayer.debug) {
            console.debug('FormItemLayer.update' + (unchangedOnly ? ' (unchanged only)' : ''), this, propertySet);
        }

        const updatePromises = this.formItemViews.map((formItemView: FormItemView) => {
            if (ObjectHelper.iFrameSafeInstanceOf(formItemView, FormItemSetView) ||
                ObjectHelper.iFrameSafeInstanceOf(formItemView, FormOptionSetView)) {
                this.setShowEmptyFormItemSetOccurrences(propertySet, formItemView.getFormItem().getName());
            }

            return formItemView.update(propertySet, unchangedOnly);
        });

        return Q.all(updatePromises).spread<void>(() => {
            return Q<void>(null);
        }).catch(DefaultErrorHandler.handle);
    }

    reset() {
        this.formItemViews.forEach((formItemView: FormItemView) => {
            formItemView.reset();
        });
    }

    toggleHelpText(show?: boolean) {
        this.formItemViews.forEach((formItemView: FormItemView) => {
            formItemView.toggleHelpText(show);
        });
    }

    hasHelpText(): boolean {
        return this.formItemViews.some((formItemView: FormItemView) => {
            return formItemView.hasHelpText();
        });
    }

    setEnabled(enable: boolean) {
        this.formItemViews.forEach((formItemView: FormItemView) => {
            formItemView.setEnabled(enable);
        });
    }

    setLazyRender(value: boolean) {
        this.lazyRender = value;
    }

    private setShowEmptyFormItemSetOccurrences(propertySet: PropertySet, name: string) {
        const propertyArray: PropertyArray = propertySet.getPropertyArray(name);

        if (!propertyArray || propertyArray.getSize() === 0) {
            if (!this.context) {
                this.context = FormContext.create().setShowEmptyFormItemSetOccurrences(false).build();
            } else {
                this.context.setShowEmptyFormItemSetOccurrences(false);
            }
        }
    }

    private doLayoutPropertySet(propertySet: PropertySet, validate: boolean = true): Q.Promise<void> {

        const inputs: InputView[] = [];

        const layoutPromises: Q.Promise<void>[] = this.formItems.map((formItem: FormItem) => {
            let formItemView: FormItemView;

            if (ObjectHelper.iFrameSafeInstanceOf(formItem, FormItemSet)) {

                const formItemSet: FormItemSet = formItem as FormItemSet;

                this.setShowEmptyFormItemSetOccurrences(propertySet, formItemSet.getName());

                formItemView = new FormItemSetView({
                    context: this.context,
                    layerFactory: this.formItemLayerFactory,
                    formSet: formItemSet,
                    parent: this.parent as FormSetOccurrenceView,
                    parentDataSet: propertySet,
                    occurrencesLazyRender: this.lazyRender
                });
            }

            if (ObjectHelper.iFrameSafeInstanceOf(formItem, FieldSet)) {

                const fieldSet: FieldSet = formItem as FieldSet;
                formItemView = new FieldSetView({
                    context: this.context,
                    layerFactory: this.formItemLayerFactory,
                    fieldSet: fieldSet,
                    parent: this.parent,
                    dataSet: propertySet,
                    lazyRender: this.lazyRender
                } as FieldSetViewConfig);
            }

            if (ObjectHelper.iFrameSafeInstanceOf(formItem, Input)) {

                const input: Input = formItem as Input;

                formItemView = new InputView({
                    context: this.context,
                    input: input,
                    parent: this.parent,
                    parentDataSet: propertySet
                } as InputViewConfig);

                inputs.push(formItemView as InputView);
            }

            if (ObjectHelper.iFrameSafeInstanceOf(formItem, FormOptionSet)) {

                const formOptionSet: FormOptionSet = formItem as FormOptionSet;

                this.setShowEmptyFormItemSetOccurrences(propertySet, formOptionSet.getName());

                formItemView = new FormOptionSetView({
                    layerFactory: this.formItemLayerFactory,
                    context: this.context,
                    formSet: formOptionSet,
                    parent: this.parent as FormSetOccurrenceView,
                    parentDataSet: propertySet,
                    occurrencesLazyRender: this.lazyRender
                });
            }

            if (ObjectHelper.iFrameSafeInstanceOf(formItem, FormOptionSetOption)) {
                const formOptionSetOption: FormOptionSetOption = formItem as FormOptionSetOption;
                formItemView = new FormOptionSetOptionView({
                    context: this.context,
                    layerFactory: this.formItemLayerFactory,
                    formOptionSetOption: formOptionSetOption,
                    parent: this.parent,
                    lazyRender: this.lazyRender,
                    formItemState: this.formItemState
                } as FormOptionSetOptionViewConfig);
            }

            this.formItemViews.push(formItemView);

            return formItemView.layout(validate);
        });

        // Bind next focus targets
        if (inputs.length > 1) {
            FocusSwitchEvent.on((event: FocusSwitchEvent) => {
                const inputTypeView = event.getInputTypeView();
                const lastIndex = inputs.length - 1;
                let currentIndex = -1;
                inputs.map((input) => input.getInputTypeView()).some((input, index) => {
                    // quick equality check
                    if (input.getElement() === inputTypeView.getElement()) {
                        currentIndex = index;
                        return true;
                    }
                    return false;
                });

                if (currentIndex >= 0) {
                    const nextIndex = currentIndex === lastIndex ? 0 : currentIndex + 1;
                    inputs[nextIndex].giveFocus();
                }
            });
        }

        return Q.all(layoutPromises).spread<void>(() => {
            return Q<void>(null);
        });
    }
}
