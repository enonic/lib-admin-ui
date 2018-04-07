module api.util.htmlarea.dialog {

    import FormItem = api.ui.form.FormItem;
    import Validators = api.ui.form.Validators;
    import ApplicationKey = api.application.ApplicationKey;
    import SelectedOptionEvent = api.ui.selector.combobox.SelectedOptionEvent;
    import ResponsiveManager = api.ui.responsive.ResponsiveManager;
    import i18n = api.util.i18n;

    export class MacroModalDialogCKE
        extends ModalDialog {

        private macroDockedPanel: MacroDockedPanel;

        private macroSelector: api.macro.MacroComboBox;

        constructor(config: any, content: api.content.ContentSummary, applicationKeys: ApplicationKey[]) {
            super(<HtmlAreaModalDialogConfig>{
                editor: config,
                title: i18n('dialog.macro.title'),
                cls: 'macro-modal-dialog',
                confirmation: {
                    yesCallback: () => this.getSubmitAction().execute(),
                    noCallback: () => this.close(),
                }
            });

            this.macroSelector.getLoader().setApplicationKeys(applicationKeys);
            this.macroDockedPanel.setContent(content);

            let onResize = api.util.AppHelper.debounce(() => {
                let formView = this.macroDockedPanel.getConfigForm();

                if (!formView) {
                    return;
                }

                let dialogHeight = this.getEl().getHeight();
                if (dialogHeight >= (wemjq('body').height() - 100)) {
                    formView.getEl().setHeightPx(0.5 * dialogHeight);
                }
            }, 500, true);

            ResponsiveManager.onAvailableSizeChanged(this, onResize);
        }

        protected layout() {
            super.layout();
            this.appendChildToContentPanel(this.macroDockedPanel = this.makeMacroDockedPanel());
        }

        private makeMacroDockedPanel(): MacroDockedPanel {
            return new MacroDockedPanel();
        }

        protected getMainFormItems(): FormItem[] {
            let macroSelector = this.createMacroSelector('macroId');

            this.setFirstFocusField(macroSelector.getInput());

            return [
                macroSelector
            ];
        }

        private createMacroSelector(id: string): FormItem {
            let loader = new api.macro.resource.MacrosLoader();
            let macroSelector = api.macro.MacroComboBox.create().setLoader(loader).setMaximumOccurrences(1).build();
            const formItemBuilder = new ModalDialogFormItemBuilder(id, i18n('dialog.macro.formitem.macro')).setValidator(
                Validators.required).setInputEl(macroSelector);
            const formItem = this.createFormItem(formItemBuilder);

            let macroSelectorComboBox = macroSelector.getComboBox();

            this.macroSelector = macroSelector;
            this.addClass('macro-selector');

            macroSelectorComboBox.onOptionSelected((event: SelectedOptionEvent<api.macro.MacroDescriptor>) => {
                formItem.addClass('selected-item-preview');
                this.addClass('shows-preview');

                this.macroDockedPanel.setMacroDescriptor(event.getSelectedOption().getOption().displayValue);
            });

            macroSelectorComboBox.onOptionDeselected(() => {
                formItem.removeClass('selected-item-preview');
                this.removeClass('shows-preview');
                this.displayValidationErrors(false);
                api.ui.responsive.ResponsiveManager.fireResizeEvent();
            });

            return formItem;
        }

        protected initializeActions() {
            let submitAction = new api.ui.Action(i18n('action.insert'));
            this.setSubmitAction(submitAction);

            this.addAction(submitAction.onExecuted(() => {
                this.displayValidationErrors(true);
                if (this.validate()) {
                    this.insertMacroIntoTextArea();
                }
            }));

            super.initializeActions();
        }

        private insertMacroIntoTextArea(): void {
            this.macroDockedPanel.getMacroPreviewString().then((macroString: string) => {
                (<CKEDITOR.editor>this.getEditor()).insertHtml(api.util.StringHelper.escapeHtml(macroString));
                this.close();
            }).catch((reason: any) => {
                api.DefaultErrorHandler.handle(reason);
                api.notify.showError(i18n('dialog.macro.error'));
            });
        }

        protected validate(): boolean {
            let mainFormValid = super.validate();
            let configPanelValid = this.macroDockedPanel.validateMacroForm();

            return mainFormValid && configPanelValid;
        }

        isDirty(): boolean {
            return this.macroSelector.isDirty();
        }
    }
}
