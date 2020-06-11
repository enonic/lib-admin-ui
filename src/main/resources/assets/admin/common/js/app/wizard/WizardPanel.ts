import * as $ from 'jquery';
import * as Q from 'q';
import {Toolbar} from '../../ui/toolbar/Toolbar';
import {ResponsiveManager} from '../../ui/responsive/ResponsiveManager';
import {ResponsiveItem} from '../../ui/responsive/ResponsiveItem';
import {Panel} from '../../ui/panel/Panel';
import {Equitable} from '../../Equitable';
import {Closeable} from '../../ui/Closeable';
import {AppBarTabId} from '../bar/AppBarTabId';
import {Element} from '../../dom/Element';
import {LoadMask} from '../../ui/mask/LoadMask';
import {SplitPanel, SplitPanelAlignment, SplitPanelBuilder, SplitPanelUnit} from '../../ui/panel/SplitPanel';
import {DivEl} from '../../dom/DivEl';
import {ActivatedEvent} from '../../ui/ActivatedEvent';
import {ElementRenderedEvent} from '../../dom/ElementRenderedEvent';
import {ElementShownEvent} from '../../dom/ElementShownEvent';
import {ElementHiddenEvent} from '../../dom/ElementHiddenEvent';
import {DefaultErrorHandler} from '../../DefaultErrorHandler';
import {Action} from '../../ui/Action';
import {H2El} from '../../dom/H2El';
import {WizardActions} from './WizardActions';
import {WizardHeader} from './WizardHeader';
import {WizardStepNavigator} from './WizardStepNavigator';
import {WizardStep} from './WizardStep';
import {WizardStepsPanel} from './WizardStepsPanel';
import {WizardClosedEvent} from './WizardClosedEvent';
import {WizardStepNavigatorAndToolbar} from './WizardStepNavigatorAndToolbar';
import {WizardValidityManager} from './WizardValidityManager';
import {MinimizeWizardPanelEvent} from './MinimizeWizardPanelEvent';
import {WizardStepForm} from './WizardStepForm';
import {ValidityChangedEvent} from '../../ValidityChangedEvent';
import {i18n} from '../../util/Messages';

/*
 Only data should be passed to constructor
 views are to be created on render
 */
export interface WizardPanelParams<EQUITABLE extends Equitable> {

    tabId: AppBarTabId;

    persistedItem?: EQUITABLE;
}

export class WizardPanel<EQUITABLE extends Equitable>
    extends Panel
    implements Closeable {

    public static debug: boolean = false;
    protected params: WizardPanelParams<EQUITABLE>;
    protected wizardActions: WizardActions<EQUITABLE>;
    protected wizardHeader: WizardHeader;
    protected livePanel: Panel;
    protected mainToolbar: Toolbar;
    protected stepToolbar: Toolbar;
    protected formIcon: Element;
    protected formMask: LoadMask;
    protected liveMask: LoadMask;
    protected formState: FormState = new FormState(true);
    protected formPanel: Panel;
    private persistedItem: EQUITABLE;
    private stepNavigator: WizardStepNavigator;
    private steps: WizardStep[];
    private stepsPanel: WizardStepsPanel;
    private dataLoaded: boolean = false;
    private closedListeners: { (event: WizardClosedEvent): void }[] = [];
    private dataLoadedListeners: { (item: EQUITABLE): void }[] = [];
    private lastFocusedElement: HTMLElement;
    private stepNavigatorAndToolbarContainer: WizardStepNavigatorAndToolbar;
    private splitPanel: SplitPanel;
    private splitPanelThreshold: number = 960;
    private stepNavigatorPlaceholder: DivEl;
    private validityManager: WizardValidityManager;
    private minimizeEditButton: DivEl;
    private minimized: boolean = false;
    private toggleMinimizeListener: (event: ActivatedEvent) => void;
    private helpTextToggleButton: DivEl;
    private helpTextShown: boolean = false;
    private scrollPosition: number = 0;
    private wizardHeaderCreatedListeners: any[] = [];
    private saving: boolean;

    constructor(params: WizardPanelParams<EQUITABLE>) {
        super('wizard-panel');

        this.setParams(params);

        this.wizardActions = this.createWizardActions();

        if (params.persistedItem) {
            this.setPersistedItem(params.persistedItem);
            this.formState.setIsNew(false);
        }

        // have to be in constructor because onValidityChanged uses it
        this.validityManager = new WizardValidityManager();

        this.initEventsListeners();
    }

    private initEventsListeners() {
        this.onRendered((event: ElementRenderedEvent) => {
            if (WizardPanel.debug) {
                console.debug('WizardPanel: rendered', event);
            }

            ResponsiveManager.onAvailableSizeChanged(this.stepNavigatorAndToolbarContainer, (item: ResponsiveItem) => {
                // update offset if step navigator is resized
                if (this.isVisible()) {
                    this.updateStickyToolbar();
                    this.stepsPanel.setScrollOffset(item.getElement().getEl().getHeight());

                    this.stepNavigatorAndToolbarContainer.checkAndMinimize();
                }
            });
        });

        this.onShown((event: ElementShownEvent) => {
            if (WizardPanel.debug) {
                console.debug('WizardPanel: shown', event);
            }
            if (this.formPanel && !this.formPanel.isRendered()) {
                this.formMask.show();
            }
            if (this.livePanel && !this.livePanel.isRendered()) {
                this.liveMask.show();
            }
        });

        this.onHidden((event: ElementHiddenEvent) => {
            if (WizardPanel.debug) {
                console.debug('WizardPanel: hidden', event);
            }
            if (this.formMask && this.formMask.isVisible()) {
                this.formMask.hide();
            }
            if (this.liveMask && this.liveMask.isVisible()) {
                this.liveMask.hide();
            }
        });
    }


    /*
     Wait for loadData to finish in order to render
     */
    doRender(): Q.Promise<boolean> {
        if (WizardPanel.debug) {
            console.debug('WizardPanel.doRender');
        }
        return super.doRender().then((rendered) => {

            let doRenderOnDataLoadedAndShown = () => {
                let deferred = Q.defer<boolean>();
                let doRenderOnShown = () => {
                    this.doRenderOnDataLoaded(rendered).then((nextRendered) => {

                        this.doLayout(this.getPersistedItem())
                            .then(() => {
                                deferred.resolve(nextRendered);

                                if (this.hasHelpText()) {
                                    this.setupHelpTextToggleButton();
                                }
                            })
                            .catch(reason => {
                                deferred.reject(reason);
                                DefaultErrorHandler.handle(reason);
                            }).done();
                    });
                };

                if (this.isVisible()) {
                    doRenderOnShown();
                } else {
                    if (WizardPanel.debug) {
                        console.debug('WizardPanel.doRender: waiting for wizard to be shown...');
                    }
                    let shownHandler = () => {
                        if (WizardPanel.debug) {
                            console.debug('WizardPanel.doRender: wizard shown, resuming render');
                        }
                        this.unShown(shownHandler);
                        doRenderOnShown();
                    };
                    this.onShown(shownHandler);
                }
                return deferred.promise;
            };

            if (this.isDataLoaded()) {
                return doRenderOnDataLoadedAndShown();
            } else {
                if (WizardPanel.debug) {
                    console.debug('WizardPanel.doRender: waiting for data to be loaded...');
                }
                let deferred = Q.defer<boolean>();

                // ensure render happens when data loaded
                this.onDataLoaded(() => {
                    if (WizardPanel.debug) {
                        console.debug('WizardPanel.doRender: data loaded, resuming render');
                    }
                    doRenderOnDataLoadedAndShown()
                        .then((nextRendered) => deferred.resolve(nextRendered))
                        .catch((reason) => deferred.reject(reason));
                });

                return deferred.promise;
            }
        });
    }

    public getMainToolbar(): Toolbar {
        return this.mainToolbar;
    }

    public getLivePanel(): Panel {
        return this.livePanel;
    }

    public getWizardHeader(): WizardHeader {
        return this.wizardHeader;
    }

    public getFormIcon(): Element {
        return this.formIcon;
    }

    public getStepToolbar(): Toolbar {
        return this.stepToolbar;
    }

    onDataLoaded(listener: (item: EQUITABLE) => void) {
        this.dataLoadedListeners.push(listener);
    }

    unDataLoaded(listener: (item: EQUITABLE) => void) {
        this.dataLoadedListeners = this.dataLoadedListeners.filter((current) => {
            return listener !== current;
        });
    }

    updateStickyToolbar() {
        const scrollTop = this.formPanel.getHTMLElement().scrollTop;
        const wizardNavigatorHeight = this.stepNavigatorAndToolbarContainer.getEl().getHeightWithBorder();

        const stickyHeight = this.getWizardHeader().getEl().getHeightWithMargin();
        // Height, when navigator soon to become sticky
        // Can be used to update the position of the elements in it
        const preStickyHeight = stickyHeight - wizardNavigatorHeight;

        const mainToolbar = this.getMainToolbar();

        if (scrollTop > stickyHeight) {
            mainToolbar.removeClass('scroll-shadow');
            this.stepNavigatorAndToolbarContainer.addClass('scroll-stick');
            if (!this.stepNavigatorPlaceholder) {
                const stepNavigatorEl = this.stepNavigatorAndToolbarContainer.getEl();
                this.stepNavigatorPlaceholder = new DivEl('toolbar-placeholder');
                this.stepNavigatorPlaceholder.insertAfterEl(this.stepNavigatorAndToolbarContainer);
                this.stepNavigatorPlaceholder.getEl().setWidthPx(stepNavigatorEl.getWidth()).setHeightPx(stepNavigatorEl.getHeight());
            }
        } else if (scrollTop < stickyHeight) {
            mainToolbar.addClass('scroll-shadow');
            this.stepNavigatorAndToolbarContainer.removeClass('scroll-stick');
            if (this.stepNavigatorPlaceholder) {
                this.stepNavigatorPlaceholder.remove();
                this.stepNavigatorPlaceholder = null;
            }
        }

        if (scrollTop > preStickyHeight) {
            this.stepNavigatorAndToolbarContainer.addClass('pre-scroll-stick');
        } else if (scrollTop < preStickyHeight) {
            this.stepNavigatorAndToolbarContainer.removeClass('pre-scroll-stick');
        }

        if (scrollTop === 0) {
            mainToolbar.removeClass('scroll-shadow');
        }

        let navigationWidth;
        if (this.minimized) {
            navigationWidth = this.splitPanel.getEl().getHeight() + this.stepNavigatorAndToolbarContainer.getEl().getPaddingLeft();
        } else {
            navigationWidth = this.stepsPanel.getEl().getWidth() - this.stepNavigatorAndToolbarContainer.getEl().getPaddingLeft();
        }
        this.stepNavigatorAndToolbarContainer.getEl().setWidthPx(navigationWidth);
    }

    updateToolbarActions() {
        if (WizardPanel.debug) {
            console.debug('WizardPanel.updateToolbarActions: isNew', this.formState.isNew());
        }
        if (this.formState.isNew()) {
            this.wizardActions.enableActionsForNew();
        } else {
            this.wizardActions.enableActionsForExisting(this.getPersistedItem());
        }
    }

    toggleMinimize(navigationIndex: number = -1) {

        this.stepsPanel.setListenToScroll(false);

        let scroll = this.stepsPanel.getScroll();
        this.minimized = !this.minimized;
        this.splitPanel.setSplitterIsHidden(this.minimized);

        this.stepNavigator.unNavigationItemActivated(this.toggleMinimizeListener);
        this.formPanel.toggleClass('minimized');

        new MinimizeWizardPanelEvent().fire();

        if (this.minimized) {
            this.stepNavigator.setScrollEnabled(false);

            this.scrollPosition = scroll;
            this.splitPanel.savePanelSizesAndDistribute(40, 0, SplitPanelUnit.PIXEL);
            this.splitPanel.hideSplitter();
            this.minimizeEditButton.getEl().setLeftPx(this.stepsPanel.getEl().getWidth());

            this.stepNavigator.onNavigationItemActivated(this.toggleMinimizeListener);
        } else {
            this.splitPanel.loadPanelSizesAndDistribute();
            this.splitPanel.showSplitter();
            this.stepsPanel.setScroll(this.scrollPosition);

            this.stepsPanel.setListenToScroll(true);
            this.stepNavigator.setScrollEnabled(true);

            this.stepNavigator.selectNavigationItem(navigationIndex, false, true);
        }

        const maximized = !this.minimized;
        if (this.helpTextToggleButton) {
            this.helpTextToggleButton.setVisible(maximized);
        }
        this.stepNavigatorAndToolbarContainer.changeOrientation(maximized);
    }

    hasHelpText(): boolean {
        return this.steps.some((step: WizardStep) => {
            return step.hasHelpText();
        });
    }

    isMinimized(): boolean {
        return this.minimized;
    }

    giveInitialFocus() {
        this.getWizardHeader().giveFocus();
        this.startRememberFocus();
    }

    startRememberFocus() {
        this.steps.forEach((step) => {
            step.getStepForm().onFocus((el) => {
                this.lastFocusedElement = <HTMLElement>el.target;
            });
        });
    }

    resetLastFocusedElement() {
        this.lastFocusedElement = null;
    }

    getTabId(): AppBarTabId {
        return this.params.tabId;
    }

    setTabId(tabId: AppBarTabId) {
        this.params.tabId = tabId;
    }

    getIconUrl(): string {
        return null; // TODO:
    }

    getActions(): Action[] {
        return this.wizardActions.getActions();
    }

    getWizardActions(): WizardActions<EQUITABLE> {
        return this.wizardActions;
    }

    getSteps(): WizardStep[] {
        return this.steps;
    }

    getStepNavigator(): WizardStepNavigator {
        return this.stepNavigator;
    }

    getStepNavigatorContainer(): WizardStepNavigatorAndToolbar {
        return this.stepNavigatorAndToolbarContainer;
    }

    setSteps(steps: WizardStep[]) {
        steps.forEach((step: WizardStep, index: number) => {
            this.addStep(step, index === 0);
        });
        this.steps = steps;
    }

    addStep(step: WizardStep, select: boolean) {
        this.stepsPanel.addNavigablePanel(step.getTabBarItem(), step.getStepForm(), step.getTabBarItem().getLabel(), select);
        this.validityManager.addItem(step);
    }

    insertStepBefore(stepToInsert: WizardStep, beforeStep: WizardStep) {
        let indexOfBeforeStep = this.steps.indexOf(beforeStep);
        this.steps.splice(indexOfBeforeStep, 0, stepToInsert);
        this.stepsPanel.insertNavigablePanel(stepToInsert.getTabBarItem(), stepToInsert.getStepForm(),
            stepToInsert.getTabBarItem().getLabel(), indexOfBeforeStep);
        this.validityManager.addItem(stepToInsert);
    }

    removeStepWithForm(form: WizardStepForm) {
        this.steps = this.steps.filter((step: WizardStep) => {
            let remove = (step.getStepForm() === form);
            if (remove) {
                this.validityManager.removeItem(step);
            }
            return !remove;
        });
        return this.stepsPanel.removeNavigablePanel(form);
    }

    doLayout(persistedItem: EQUITABLE): Q.Promise<void> {
        if (WizardPanel.debug) {
            console.debug('WizardPanel.doLayout', persistedItem);
        }
        return Q<void>(null);
    }

    getPersistedItem(): EQUITABLE {
        return this.persistedItem;
    }

    isItemPersisted(): boolean {
        return this.persistedItem != null;
    }

    /*
     * Override this method in specific wizard to do proper check.
     */
    hasUnsavedChanges(): boolean {
        return false;
    }

    isSaving(): boolean {
        return this.saving;
    }

    saveChanges(): Q.Promise<EQUITABLE> {
        this.saving = true;

        if (this.isItemPersisted()) {
            return this.updatePersistedItem().then((persistedItem: EQUITABLE) => {
                this.setPersistedItem(persistedItem);
                this.formState.setIsNew(false);
                this.updateToolbarActions();
                return this.postUpdatePersistedItem(persistedItem);
            }).finally(() => {
                this.saving = false;
            });

        } else {
            return this.persistNewItem().then((persistedItem: EQUITABLE) => {
                this.setPersistedItem(persistedItem);
                // persist new happens before render to init dummy entity and is still considered as new
                if (this.isRendered()) {
                    this.formState.setIsNew(false);
                    this.updateToolbarActions();
                }
                return this.postPersistNewItem(persistedItem);
            }).finally(() => {
                this.saving = false;
            });
        }
    }

    /*
     * Override this method in specific wizard to do actual persisting of new item.
     */
    persistNewItem(): Q.Promise<EQUITABLE> {
        throw new Error('Must be overriden by inheritor');
    }

    postPersistNewItem(persistedItem: EQUITABLE): Q.Promise<EQUITABLE> {
        // To be overridden by inheritors - if extra work is needed at end of persistNewItem

        return Q(persistedItem);
    }

    /*
     * Override this method in specific wizard to do actual update of item.
     */
    updatePersistedItem(): Q.Promise<EQUITABLE> {
        throw new Error('Must be overriden by inheritor');
    }

    postUpdatePersistedItem(persistedItem: EQUITABLE): Q.Promise<EQUITABLE> {
        // To be overridden by inheritors - if extra work is needed at end of updatePersistedItem

        return Q(persistedItem);
    }

    close(checkCanClose: boolean = false) {
        this.notifyClosed(checkCanClose);
    }

    canClose(): boolean {
        return !this.hasUnsavedChanges();
    }

    onClosed(listener: (event: WizardClosedEvent) => void) {
        this.closedListeners.push(listener);
    }

    unClosed(listener: (event: WizardClosedEvent) => void) {
        this.closedListeners = this.closedListeners.filter((currentListener: (event: WizardClosedEvent) => void) => {
            return currentListener !== listener;
        });
    }

    getSplitPanel(): SplitPanel {
        return this.splitPanel;
    }

    showMinimizeEditButton() {
        this.addClass('wizard-panel--live');
    }

    hideMinimizeEditButton() {
        this.removeClass('wizard-panel--live');
    }

    onValidityChanged(listener: (event: ValidityChangedEvent) => void) {
        this.validityManager.onValidityChanged(listener);
    }

    unValidityChanged(listener: (event: ValidityChangedEvent) => void) {
        this.validityManager.unValidityChanged(listener);
    }

    notifyValidityChanged(valid: boolean) {
        this.validityManager.notifyValidityChanged(valid);
    }

    onWizardHeaderCreated(listener: () => void) {
        this.wizardHeaderCreatedListeners.push(listener);
    }

    unWizardHeaderCreated(listener: () => void) {
        this.wizardHeaderCreatedListeners = this.wizardHeaderCreatedListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    notifyWizardHeaderCreated() {
        this.wizardHeaderCreatedListeners.forEach((listener: () => void) => {
            listener.call(this);
        });
    }

    isValid() {
        return this.validityManager.isAllValid();
    }

    protected setParams(params: WizardPanelParams<EQUITABLE>) {
        this.params = params;
    }

    protected getParams(): WizardPanelParams<EQUITABLE> {
        return this.params;
    }

    protected createWizardActions(): WizardActions<EQUITABLE> {
        throw Error('Override me');
    }

    /*
     Loads necessary data for rendering on wizard open
     */
    protected loadData() {
        if (WizardPanel.debug) {
            console.debug('WizardPanel.loadData');
        }

        this.dataLoaded = false;
        this.doLoadData().done((item: EQUITABLE) => {
            this.dataLoaded = true;
            if (WizardPanel.debug) {
                console.debug('WizardPanel.loadData: data loaded', item);
            }
            this.notifyDataLoaded(item);
        }, (reason) => {
            DefaultErrorHandler.handle(reason);
        });
    }

    protected doLoadData(): Q.Promise<EQUITABLE> {
        if (WizardPanel.debug) {
            console.debug('WizardPanel.doLoadData');
        }
        let deferred = Q.defer<EQUITABLE>();

        if (!this.getPersistedItem()) {
            if (WizardPanel.debug) {
                console.debug('WizardPanel.doLoadData: loading new data...');
            }
            // Ensure a nameless and empty content is persisted before rendering new
            this.saveChanges().then((equitable) => {
                if (WizardPanel.debug) {
                    console.debug('WizardPanel.doLoadData: data created', equitable);
                }
                deferred.resolve(equitable);
            }).catch((reason) => {
                deferred.reject(reason);
            }).done();
        } else {
            let equitable = this.getPersistedItem();
            if (WizardPanel.debug) {
                console.debug('WizardPanel.doLoadData: data present, skipping load...', equitable);
            }
            deferred.resolve(equitable);
        }

        return deferred.promise;
    }

    protected isDataLoaded(): boolean {
        return this.dataLoaded;
    }

    protected createMainToolbar(): Toolbar {
        return null;
    }

    protected createLivePanel(): Panel {
        return null;
    }

    protected createWizardHeader(): WizardHeader {
        return null;
    }

    protected createFormIcon(): Element {
        return null;
    }

    protected createStepToolbar(): Toolbar {
        return null;
    }

    protected onFormPanelAdded(skipMask: boolean = false) {
        if (WizardPanel.debug) {
            console.debug('WizardPanel: formPanel.onAdded');
        }
        this.formMask = new LoadMask(this.formPanel);

        if (!skipMask) {
            this.formMask.show();
        }
    }

    protected doRenderOnDataLoaded(rendered: boolean): Q.Promise<boolean> {
        if (WizardPanel.debug) {
            console.debug('WizardPanel.doRenderOnDataLoaded');
        }

        let updateMinimizeButtonPosition = () => {
            this.minimizeEditButton.getEl().setLeftPx(this.stepsPanel.getEl().getWidth());
        };

        this.updateToolbarActions();

        this.formPanel = new Panel('form-panel rendering');
        this.formPanel.onScroll(() => this.updateStickyToolbar());

        this.formPanel.onAdded(() => this.onFormPanelAdded());

        let firstShow;
        this.formPanel.onRendered(() => {
            if (WizardPanel.debug) {
                console.debug('WizardPanel: formPanel.onRendered');
            }
            firstShow = true;
            this.formMask.hide();
            this.formPanel.removeClass('rendering');

            if (this.mainToolbar) {
                this.mainToolbar.removeClass('rendering');
            }

            if (firstShow ) {
                firstShow = false;
                this.checkIfEditIsAllowed().then((editIsAllowed: boolean) => editIsAllowed && this.giveInitialFocus());
            }

            if (!!this.lastFocusedElement) {
                this.lastFocusedElement.focus();
            }

            if (this.minimizeEditButton) {
                updateMinimizeButtonPosition();
            }

            // check validity on rendered
            this.notifyValidityChanged(this.isValid());
        });

        this.mainToolbar = this.createMainToolbar();
        if (this.mainToolbar) {
            this.mainToolbar.addClass('rendering');
        }

        let headerAndNavigatorContainer = new DivEl('header-and-navigator-container');

        this.formIcon = this.createFormIcon();
        if (this.formIcon) {
            headerAndNavigatorContainer.appendChild(this.formIcon);
        }

        this.wizardHeader = this.createWizardHeader();
        if (this.wizardHeader) {
            headerAndNavigatorContainer.appendChild(this.wizardHeader);
            this.notifyWizardHeaderCreated();
            this.validityManager.setHeader(this.wizardHeader);
        }

        this.stepToolbar = this.createStepToolbar();
        this.stepNavigator = new WizardStepNavigator();
        this.stepNavigatorAndToolbarContainer = new WizardStepNavigatorAndToolbar(this.stepNavigator, this.stepToolbar);

        headerAndNavigatorContainer.appendChild(this.stepNavigatorAndToolbarContainer);

        this.stepsPanel = new WizardStepsPanel(this.stepNavigator, this.formPanel);
        this.stepNavigatorAndToolbarContainer.onShown((event: ElementShownEvent) => {
            // set scroll offset equal to the height of the step navigator to switch steps at the bottom of it when sticky
            this.stepsPanel.setScrollOffset(event.getElement().getEl().getHeight());
        });

        this.formPanel.appendChildren(headerAndNavigatorContainer, this.stepsPanel);

        let leftPanel: Panel;
        this.livePanel = this.createLivePanel();
        if (this.livePanel) {
            this.livePanel.addClass('rendering');

            this.toggleMinimizeListener = (event: ActivatedEvent) => {
                this.toggleMinimize(event.getIndex());
            };
            this.minimizeEditButton = new DivEl('minimize-edit');
            ResponsiveManager.onAvailableSizeChanged(this.formPanel, updateMinimizeButtonPosition);

            this.minimizeEditButton.onClicked(this.toggleMinimize.bind(this, -1));

            this.formPanel.prependChild(this.minimizeEditButton);

            this.livePanel.onAdded(() => {
                if (WizardPanel.debug) {
                    console.debug('WizardPanel: livePanel.onAdded');
                }
                this.liveMask = new LoadMask(this.livePanel);
            });

            this.livePanel.onRendered(() => {
                if (WizardPanel.debug) {
                    console.debug('WizardPanel: livePanel.onRendered');
                }
                this.liveMask.hide();
                this.livePanel.removeClass('rendering');
            });

            this.splitPanel = this.createSplitPanel(this.formPanel, this.livePanel);

            if (WizardPanel.debug) {
                this.splitPanel.onAdded(() => {
                    console.debug('WizardPanel: splitPanel.onAdded');
                });

                this.splitPanel.onRendered(() => {
                    console.debug('WizardPanel: splitPanel.onRendered');
                });
            }

            leftPanel = this.splitPanel;
        } else {
            leftPanel = this.formPanel;
        }

        const leftPanelAndToolbar = new Panel();
        if (this.mainToolbar) {
            leftPanelAndToolbar.prependChild(this.mainToolbar);
        }

        const detailsSplitPanel = this.createWizardAndDetailsSplitPanel(leftPanel);
        if (detailsSplitPanel) {
            detailsSplitPanel.addClass('rendering');
            detailsSplitPanel.onRendered(() => detailsSplitPanel.removeClass('rendering'));
            leftPanelAndToolbar.appendChild(detailsSplitPanel);
        } else {
            leftPanelAndToolbar.appendChild(leftPanel);
        }
        this.appendChild(leftPanelAndToolbar);

        return Q(rendered);
    }

    protected checkIfEditIsAllowed(): Q.Promise<boolean> {
        return Q.resolve(true);
    }

    protected createWizardAndDetailsSplitPanel(_leftPanel: Panel): SplitPanel {
        // underscore prevents ts unused param check
        return null;
    }

    protected getWizardStepsPanel(): WizardStepsPanel {
        return this.stepsPanel;
    }

    protected getHeader(index: number): H2El {
        return this.stepsPanel.getHeader(index);
    }

    protected setPersistedItem(newPersistedItem: EQUITABLE): void {
        if (WizardPanel.debug) {
            console.debug('WizardPanel.setPersistedItem', newPersistedItem);
        }
        this.persistedItem = newPersistedItem;
    }

    private notifyDataLoaded(item: EQUITABLE) {
        this.dataLoadedListeners.forEach((listener) => {
            listener(item);
        });
    }

    private toggleHelpTextShown() {
        this.helpTextShown = !this.helpTextShown;
        this.helpTextToggleButton.toggleClass('on', this.helpTextShown);
        this.helpTextToggleButton.setTitle(this.helpTextShown ? i18n('tooltip.helptexts.hide') : i18n('tooltip.helptexts.show'));

        this.steps.forEach((step: WizardStep) => {
            step.toggleHelpText(this.helpTextShown);
        });
    }

    private setupHelpTextToggleButton() {
        this.helpTextToggleButton = this.stepNavigatorAndToolbarContainer.setupHelpTextToggleButton();
        this.helpTextToggleButton.setTitle(i18n('tooltip.helptexts.show'));

        this.helpTextToggleButton.onClicked(() => {
            this.toggleHelpTextShown();
        });
    }

    private createSplitPanel(firstPanel: Panel, secondPanel: Panel): SplitPanel {
        const builder = new SplitPanelBuilder(firstPanel, secondPanel)
            .setFirstPanelMinSize(280, SplitPanelUnit.PIXEL)
            .setAlignment(SplitPanelAlignment.VERTICAL);

        if ($(window).width() > this.splitPanelThreshold) {
            builder.setFirstPanelSize(38, SplitPanelUnit.PERCENT);
        }

        const splitPanel = builder.build();
        splitPanel.addClass('wizard-and-preview');

        return splitPanel;
    }

    private notifyClosed(checkCanClose: boolean) {
        this.closedListeners.forEach((listener: (event: WizardClosedEvent) => void) => {
            listener(new WizardClosedEvent(this, checkCanClose));
        });
    }
}

export class FormState {

    private formIsNew: boolean;

    constructor(isNew: boolean) {
        this.formIsNew = isNew;
    }

    setIsNew(value: boolean) {
        this.formIsNew = value;
    }

    isNew() {
        return this.formIsNew;
    }
}
