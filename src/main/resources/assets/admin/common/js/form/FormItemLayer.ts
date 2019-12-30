import * as Q from 'q';
import {PropertySet} from '../data/PropertySet';
import {PropertyArray} from '../data/PropertyArray';
import {FocusSwitchEvent} from '../ui/FocusSwitchEvent';
import {Element} from '../dom/Element';
import {ObjectHelper} from '../ObjectHelper';
import {FormOptionSetView, FormOptionSetViewConfig} from './set/optionset/FormOptionSetView';
import {FormOptionSetOptionView, FormOptionSetOptionViewConfig} from './set/optionset/FormOptionSetOptionView';
import {DefaultErrorHandler} from '../DefaultErrorHandler';
import {FormContext} from './FormContext';
import {FormItem} from './FormItem';
import {FormItemView} from './FormItemView';
import {FormItemOccurrenceView} from './FormItemOccurrenceView';
import {InputView, InputViewConfig} from './InputView';
import {FormItemSet} from './set/itemset/FormItemSet';
import {FormItemSetView, FormItemSetViewConfig} from './set/itemset/FormItemSetView';
import {FieldSet} from './set/fieldset/FieldSet';
import {FieldSetView, FieldSetViewConfig} from './set/fieldset/FieldSetView';
import {Input} from './Input';
import {FormOptionSet} from './set/optionset/FormOptionSet';
import {FormOptionSetOption} from './set/optionset/FormOptionSetOption';
import {FormItemLayerFactory} from './FormItemLayerFactory';

export class FormItemLayer {

    public static debug: boolean = false;

    private context: FormContext;

    private formItems: FormItem[];

    private parentEl: Element;

    private formItemViews: FormItemView[] = [];

    private parent: FormItemOccurrenceView;

    private lazyRender: boolean = true;

    private formItemLayerFactory: FormItemLayerFactory;

    constructor(context: FormContext, layerFactory: FormItemLayerFactory) {
        this.context = context;
        this.formItemLayerFactory = layerFactory;
    }

    setFormItems(formItems: FormItem[]): FormItemLayer {
        this.formItems = formItems;
        return this;
    }

    setParentElement(parentEl: Element): FormItemLayer {
        this.parentEl = parentEl;
        return this;
    }

    setParent(value: FormItemOccurrenceView): FormItemLayer {
        this.parent = value;
        return this;
    }

    layout(propertySet: PropertySet, validate: boolean = true): Q.Promise<FormItemView[]> {

        this.formItemViews = [];

        return this.doLayoutPropertySet(propertySet, validate).then(() => {
            return Q<FormItemView[]>(this.formItemViews);
        });
    }

    clean() {
        this.formItemViews.forEach((view: FormItemView) => {
            if (ObjectHelper.iFrameSafeInstanceOf(view, FormOptionSetOptionView)) {
                (<FormOptionSetOptionView>view).clean();
            }
        });
    }

    update(propertySet: PropertySet, unchangedOnly?: boolean): Q.Promise<void> {
        if (FormItemLayer.debug) {
            console.debug('FormItemLayer.update' + (unchangedOnly ? ' (unchanged only)' : ''), this, propertySet);
        }

        const updatePromises = this.formItemViews.map((formItemView: FormItemView) => {
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
            let formItemView;

            if (ObjectHelper.iFrameSafeInstanceOf(formItem, FormItemSet)) {

                const formItemSet: FormItemSet = <FormItemSet>formItem;

                this.setShowEmptyFormItemSetOccurrences(propertySet, formItemSet.getName());

                formItemView = new FormItemSetView(<FormItemSetViewConfig>{
                    context: this.context,
                    layerFactory: this.formItemLayerFactory,
                    formItemSet: formItemSet,
                    parent: this.parent,
                    parentDataSet: propertySet,
                    occurrencesLazyRender: this.lazyRender
                });
            }

            if (ObjectHelper.iFrameSafeInstanceOf(formItem, FieldSet)) {

                const fieldSet: FieldSet = <FieldSet>formItem;
                formItemView = new FieldSetView(<FieldSetViewConfig>{
                    context: this.context,
                    layerFactory: this.formItemLayerFactory,
                    fieldSet: fieldSet,
                    parent: this.parent,
                    dataSet: propertySet,
                    lazyRender: this.lazyRender
                });
            }

            if (ObjectHelper.iFrameSafeInstanceOf(formItem, Input)) {

                const input: Input = <Input>formItem;

                formItemView = new InputView(<InputViewConfig>{
                    context: this.context,
                    input: input,
                    parent: this.parent,
                    parentDataSet: propertySet
                });

                inputs.push(formItemView);
            }

            if (ObjectHelper.iFrameSafeInstanceOf(formItem, FormOptionSet)) {

                const formOptionSet: FormOptionSet = <FormOptionSet>formItem;

                this.setShowEmptyFormItemSetOccurrences(propertySet, formOptionSet.getName());

                formItemView = new FormOptionSetView(<FormOptionSetViewConfig>{
                    layerFactory: this.formItemLayerFactory,
                    context: this.context,
                    formOptionSet: formOptionSet,
                    parent: this.parent,
                    parentDataSet: propertySet
                });
            }

            if (ObjectHelper.iFrameSafeInstanceOf(formItem, FormOptionSetOption)) {
                const formOptionSetOption: FormOptionSetOption = <FormOptionSetOption>formItem;
                formItemView = new FormOptionSetOptionView(<FormOptionSetOptionViewConfig>{
                    context: this.context,
                    layerFactory: this.formItemLayerFactory,
                    formOptionSetOption: formOptionSetOption,
                    parent: this.parent,
                    parentDataSet: propertySet,
                    lazyRender: this.lazyRender
                });
            }

            this.formItemViews.push(formItemView);

            return formItemView.layout(validate);

        });

        this.parentEl.onRendered(() => {
            this.formItemViews.map(formItemView => this.parentEl.appendChild(formItemView, this.lazyRender));
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
