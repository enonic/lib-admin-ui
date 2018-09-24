module api.form.inputtype.appconfig {

    import FormView = api.form.FormView;
    import InputView = api.form.InputView;
    import ComboBox = api.ui.selector.combobox.ComboBox;
    import Application = api.application.Application;
    import ResponsiveManager = api.ui.responsive.ResponsiveManager;
    import ModalDialogConfig = api.ui.dialog.ModalDialogConfig;
    import BaseInputTypeManagingAdd = api.form.inputtype.support.BaseInputTypeManagingAdd;
    import ContentSummary = api.content.ContentSummary;
    import AppHelper = api.util.AppHelper;

    export class ApplicationConfiguratorDialog
        extends api.ui.dialog.ModalDialog {

        public static debug: boolean = false;

        private formView: FormView;

        private okCallback: () => void;

        private cancelCallback: () => void;

        constructor(application: Application, formView: FormView, okCallback?: () => void, cancelCallback?: () => void) {
            super(<ModalDialogConfig>{
                confirmation: {
                    yesCallback: () => {
                        if (okCallback) {
                            okCallback();
                        }
                        this.close();
                    },
                    noCallback: () => {
                        this.close();
                    }
                }
            });

            this.appendChildToHeader(this.getHeaderContent(application));

            this.formView = formView;
            this.okCallback = okCallback;
            this.cancelCallback = cancelCallback;

            this.addClass('application-configurator-dialog');

            const availableSizeChangedListener = () => this.handleAvailableSizeChanged();
            ResponsiveManager.onAvailableSizeChanged(this, availableSizeChangedListener);
            this.onRemoved(() => {
                ResponsiveManager.unAvailableSizeChanged(this);
            });
        }

        toggleMask(enable: boolean) {
            this.toggleClass('masked', enable);
            this.toggleClass('await-confirmation', enable);
        }

        handleAvailableSizeChanged() {
            const content = this.getContentPanel();
            const contentHeight = content.getEl().getHeightWithoutPadding();
            const contentChildrenHeight = content.getChildren().reduce((prev, curr) => {
                return prev + curr.getEl().getHeightWithMargin();
            }, 0);

            const isScrollable = contentHeight < contentChildrenHeight;

            this.toggleClass('scrollable', isScrollable);
        }

        doRender(): Q.Promise<boolean> {
            return super.doRender().then((rendered) => {
                if (ApplicationConfiguratorDialog.debug) {
                    console.debug('ApplicationConfiguratorDialog.doRender');
                }

                this.appendChildToContentPanel(this.formView);

                this.addOkButton(this.okCallback);
                this.getCancelAction().onExecuted(() => this.cancelCallback());

                this.addCancelButtonToBottom();

                return this.formView.layout().then(() => {
                    this.addClass('animated');

                    wemjq(this.getHTMLElement()).find('input[type=text],input[type=radio],textarea,select').first().focus();
                    this.updateTabbable();

                    setTimeout(() => {
                        ResponsiveManager.fireResizeEvent();
                        this.handleSelectorsDropdowns(this.formView);
                        this.handleDialogClose(this.formView);
                    }, 100);

                    return rendered;
                });
            });
        }

        private addOkButton(okCallback: () => void) {
            let okAction = new api.ui.Action('Apply');
            this.addAction(okAction, true, true);
            okAction.onExecuted(() => {
                if (okCallback) {
                    okCallback();
                }
                this.close();
            });
        }

        protected getHeaderContent(application: Application): api.app.NamesAndIconView {
            let namesAndIconView = new api.app.NamesAndIconView(new api.app.NamesAndIconViewBuilder().setSize(
                api.app.NamesAndIconViewSize.large)).setMainName(application.getDisplayName()).setSubName(
                application.getName() + '-' + application.getVersion());

            if (application.getIconUrl()) {
                namesAndIconView.setIconUrl(application.getIconUrl());
            }

            if (application.getDescription()) {
                namesAndIconView.setSubName(application.getDescription());
            }

            return namesAndIconView;
        }

        private handleSelectorsDropdowns(formView: FormView) {
            const comboBoxes = this.findComboboxes(formView);

            const debouncedHideDropdowns = api.util.AppHelper.debounce(() => {
                comboBoxes.forEach((comboBox: ComboBox<any>) => {
                    comboBox.hideDropdown();
                });
            }, 100, true);

            this.getContentPanel().onScrolled(debouncedHideDropdowns);
        }

        private findComboboxes(element: api.dom.Element): ComboBox<any>[] {
            if (element instanceof ComboBox) {
                return [<ComboBox<any>>element];
            }

            return api.util.ArrayHelper.flatten(element.getChildren().map(child => this.findComboboxes(child)));
        }

        private handleDialogClose(formView: FormView) {
            formView.getChildren().forEach((element: api.dom.Element) => {
                if (api.ObjectHelper.iFrameSafeInstanceOf(element, InputView)) {
                    const inputTypeView = (<InputView> element).getInputTypeView();
                    if (api.ObjectHelper.iFrameSafeInstanceOf(inputTypeView, BaseInputTypeManagingAdd)) {
                        (<BaseInputTypeManagingAdd> inputTypeView).onEditContentRequest((content: ContentSummary) => {
                            if (content.isImage()) {
                                this.close();
                            }
                        });
                    }
                }
            });
        }

        show() {
            super.show();
        }

        close() {
            super.close();
            this.remove();
        }

        isDirty(): boolean {
            return AppHelper.isDirty(this.formView);
        }
    }
}
