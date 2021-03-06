module FormItemSetViewSpec {

    import FormItemSet = api.form.FormItemSet;
    import FormItemSetView = api.form.FormItemSetView;
    import PropertySet = api.data.PropertySet;
    import FormContext = api.form.FormContext;
    import FormItemSetViewConfig = api.form.FormItemSetViewConfig;

    describe('api.form.FormItemSetView', function () {

        let itemSet: FormItemSet;

        beforeEach(function () {
            itemSet = FormItemSetSpec.createItemSet(FormItemSetSpec.getItemSetJson());

            createItemSetView(itemSet, getPropertySet());
        });

        describe('constructor', function () {

            it('should correctly initialize label', function () {
                expect(itemSet.getLabel()).toEqual('Custom Item Set');
            });

            it('should correctly initialize help text', function () {
                expect(itemSet.getHelpText()).toEqual('Custom Help Text');
            });

            it('should correctly initialize custom text', function () {
                expect(itemSet.getCustomText()).toEqual('Custom text');
            });

            it('should correctly initialize immutable property', function () {
                expect(itemSet.isImmutable()).toBeFalsy();
            });

            it('should correctly initialize occurrences config', function () {
                expect(itemSet.getOccurrences().getMinimum()).toEqual(5);
                expect(itemSet.getOccurrences().getMaximum()).toEqual(7);
            });
        });
    });

    export function createItemSetView(itemSet: FormItemSet, dataSet: PropertySet): FormItemSetView {
        return new FormItemSetView(getFormItemSetViewConfig(itemSet, dataSet));
    }

    export function getFormItemSetViewConfig(itemSet: FormItemSet, dataSet: PropertySet): FormItemSetViewConfig {
        return {
            context: getFormContext(),
            formItemSet: itemSet,
            parent: undefined,
            parentDataSet: dataSet
        };
    }

    export function getFormContext(): FormContext {
        return FormContext.create().setShowEmptyFormItemSetOccurrences(true).build();
    }

    export function getPropertySet(): PropertySet {
        let tree = new api.data.PropertyTree();

        return tree.getRoot();
    }
}
