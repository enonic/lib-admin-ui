// import * as $ from 'jquery'; // jquery is a peerDependency
import * as Q from 'q';
import {FormView} from '../../FormView';
import {ComboBox} from '../../../ui/selector/combobox/ComboBox';
import {Application} from '../../../application/Application';
import {ResponsiveManager} from '../../../ui/responsive/ResponsiveManager';
import {AppHelper} from '../../../util/AppHelper';
import {Action} from '../../../ui/Action';
import {NamesAndIconView, NamesAndIconViewBuilder} from '../../../app/NamesAndIconView';
import {NamesAndIconViewSize} from '../../../app/NamesAndIconViewSize';
import {Element} from '../../../dom/Element';
import {ArrayHelper} from '../../../util/ArrayHelper';
import {ModalDialogWithConfirmation, ModalDialogWithConfirmationConfig} from '../../../ui/dialog/ModalDialogWithConfirmation';
import {FormValidityChangedEvent} from '../../FormValidityChangedEvent';

export interface ApplicationConfiguratorDialogConfig
    extends ModalDialogWithConfirmationConfig, ApplicationConfiguratorDialogParams {
}

export interface ApplicationConfiguratorDialogParams {
    formView: FormView;
    application: Application;
    okCallback?: () => void;
    cancelCallback?: () => void;
}

export class ApplicationConfiguratorDialog
    extends ModalDialogWithConfirmation {

    public static debug: boolean = false;
    protected config: ApplicationConfiguratorDialogConfig;
    private formView: FormView;
    private okAction: Action;

    constructor(params: ApplicationConfiguratorDialogParams) {
        super({
            application: params.application,
            formView: params.formView,
            cancelCallback: params.cancelCallback,
            class: 'application-configurator-dialog',
            confirmation: {
                yesCallback: () => {
                    if (params.okCallback) {
                        params.okCallback();
                    }
                    this.close();
                },
                noCallback: () => {
                    if (params.cancelCallback) {
                        params.cancelCallback();
                    }
                    this.close();
                }
            }
        } as ApplicationConfiguratorDialogConfig);
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
            $(this.getHTMLElement()).find('input[type=text],input[type=radio],textarea,select').first().trigger('focus');
        });

        this.getCancelAction().onExecuted(this.config.cancelCallback);

        this.okAction.onExecuted(this.config.confirmation.yesCallback);

        this.formView.onValidityChanged((event: FormValidityChangedEvent) => {
            const isValid: boolean = event.isValid();
            this.okAction.setEnabled(isValid);
            this.formView.displayValidationErrors(!isValid);
        });
    }

    protected handleClickOutside() {
        if (this.formView.isValid()) {
            super.handleClickOutside();
        } else {
            if (this.config.cancelCallback) {
                this.config.cancelCallback();
            }

            this.close();
        }
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
                }, 100);

                return rendered;
            });
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

    protected getHeaderContent(): NamesAndIconView {
        const application: Application = this.config.application;
        const namesAndIconView = new NamesAndIconView(new NamesAndIconViewBuilder().setSize(
            NamesAndIconViewSize.large)).setMainName(application.getDisplayName()).setSubName(
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

        const debouncedHideDropdowns = AppHelper.debounce(() => {
            comboBoxes.forEach((comboBox: ComboBox<any>) => {
                comboBox.hideDropdown();
            });
        }, 100, true);

        this.getContentPanel().onScrolled(debouncedHideDropdowns);
    }

    private findComboboxes(element: Element): ComboBox<any>[] {
        if (element instanceof ComboBox) {
            return [element];
        }

        return ArrayHelper.flatten(element.getChildren().map(child => this.findComboboxes(child)));
    }
}
