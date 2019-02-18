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
    import Action = api.ui.Action;

    export interface ApplicationConfiguratorDialogConfig
        extends ModalDialogConfig {
        formView: FormView;
        application: Application;
        cancelCallback: () => void;
    }

    export class ApplicationConfiguratorDialog
        extends api.ui.dialog.ModalDialog {

        public static debug: boolean = false;

        private formView: FormView;

        private okAction: Action;

        protected config: ApplicationConfiguratorDialogConfig;

        constructor(application: Application, formView: FormView, okCallback?: () => void, cancelCallback?: () => void) {
            super(<ApplicationConfiguratorDialogConfig>{
                application: application,
                formView: formView,
                cancelCallback: cancelCallback,
                class: 'application-configurator-dialog',
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
        }

        protected initElements() {
            super.initElements();

            this.formView = this.config.formView;
            this.okAction = new Action('Apply');
        }

        protected initListeners() {
            super.initListeners();

            const availableSizeChangedListener = () => this.handleAvailableSizeChanged();
            ResponsiveManager.onAvailableSizeChanged(this, availableSizeChangedListener);
            this.onRemoved(() => {
                ResponsiveManager.unAvailableSizeChanged(this);
            });

            this.onRendered(() => {
                wemjq(this.getHTMLElement()).find('input[type=text],input[type=radio],textarea,select').first().focus();
                this.updateTabbable();
            });

            this.getCancelAction().onExecuted(this.config.cancelCallback);

            this.okAction.onExecuted(this.config.confirmation.yesCallback);
        }

        toggleMask(enable: boolean) {
            if (enable) {
                this.mask();
            } else {
                this.unmask();
            }
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

                this.appendChildToHeader(this.getHeaderContent());
                this.appendChildToContentPanel(this.formView);

                this.addAction(this.okAction, true, true);

                this.addCancelButtonToBottom();

                return this.formView.layout().then(() => {
                    this.addClass('animated');

                    setTimeout(() => {
                        ResponsiveManager.fireResizeEvent();
                        this.handleSelectorsDropdowns(this.formView);
                        this.handleDialogClose(this.formView);
                    }, 100);

                    return rendered;
                });
            });
        }

        protected getHeaderContent(): api.app.NamesAndIconView {
            const application: Application = this.config.application;
            const namesAndIconView = new api.app.NamesAndIconView(new api.app.NamesAndIconViewBuilder().setSize(
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
