import {NavigationItem} from '../ui/NavigationItem';
import {Panel} from '../ui/panel/Panel';
import {AppBarTabMenuItem, AppBarTabMenuItemBuilder} from './bar/AppBarTabMenuItem';
import {NavigatorEvent} from '../ui/NavigatorEvent';
import {i18n} from '../util/Messages';
import {AppPanel} from './AppPanel';
import {ShowBrowsePanelEvent} from './ShowBrowsePanelEvent';
import {AppBarTabMenu} from './bar/AppBarTabMenu';
import {AppBar} from './bar/AppBar';
import {TabbedAppBar} from './bar/TabbedAppBar';
import {ItemViewPanel} from './view/ItemViewPanel';
import {ItemViewClosedEvent} from './view/ItemViewClosedEvent';
import {WizardPanel} from './wizard/WizardPanel';
import {WizardClosedEvent} from './wizard/WizardClosedEvent';
import {ObjectHelper} from '../ObjectHelper';
import {BrowsePanel} from './browse/BrowsePanel';
import {AppBarTabId} from './bar/AppBarTabId';
import {Action} from '../ui/Action';

export class NavigatedAppPanel
    extends AppPanel {

    private readonly appBarTabMenu: AppBarTabMenu;

    private appBar: AppBar;

    constructor(appBar: TabbedAppBar) {
        super('navigated-panel');

        this.appBar = appBar;

        this.appBarTabMenu = appBar.getTabMenu();

        this.appBarTabMenu.onNavigationItemSelected((event: NavigatorEvent) => {
            this.showPanelByIndex(event.getItem().getIndex());
        });
    }

    selectPanel(item: NavigationItem) {
        this.selectPanelByIndex(item.getIndex());
    }

    selectPanelByIndex(index: number) {
        this.appBarTabMenu.selectNavigationItem(index);
        // panel will be shown because of the selected navigator listener in constructor
    }

    addNavigablePanel(item: AppBarTabMenuItem, panel: Panel, select?: boolean) {
        this.appBarTabMenu.addNavigationItem(item);
        const index = this.addPanel(panel);
        if (index === 1) {
            this.appBar.setHomeIconAction();
        }
        if (select) {
            this.selectPanelByIndex(index);
        }
        return index;
    }

    removeNavigablePanel(panel: Panel, checkCanRemovePanel: boolean = true): number {
        let index = this.removePanel(panel, checkCanRemovePanel);
        if (index > -1) {
            let navigationItem: AppBarTabMenuItem = this.appBarTabMenu.getNavigationItem(index) as AppBarTabMenuItem;
            this.appBarTabMenu.removeNavigationItem(navigationItem);
        }

        if (this.appBarTabMenu.countVisible() === 0) {
            this.appBar.unsetHomeIconAction();
        }

        this.checkBrowsePanelNeedsToBeShown(index, panel);

        return index;
    }

    getAppBarTabMenu(): AppBarTabMenu {
        return this.appBarTabMenu;
    }

    addViewPanel(tabMenuItem: AppBarTabMenuItem, viewPanel: ItemViewPanel) {
        this.addNavigablePanel(tabMenuItem, viewPanel, true);

        viewPanel.onClosed((event: ItemViewClosedEvent) => {
            this.removeNavigablePanel(event.getView(), false);
        });
    }

    addWizardPanel(tabMenuItem: AppBarTabMenuItem, wizardPanel: WizardPanel<any>) {
        this.addNavigablePanel(tabMenuItem, wizardPanel, true);

        wizardPanel.onClosed((event: WizardClosedEvent) => {
            this.removeNavigablePanel(event.getWizard(), false);
        });
    }

    canRemovePanel(panel: Panel): boolean {
        if (ObjectHelper.iFrameSafeInstanceOf(panel, WizardPanel)) {
            let wizardPanel: WizardPanel<any> = panel as WizardPanel<any>;
            return wizardPanel.canClose();
        }
        return true;
    }

    protected addBrowsePanel(browsePanel: BrowsePanel) {
        if (!this.browsePanel) {
            this.browsePanel = browsePanel;

            let browseMenuItem = new AppBarTabMenuItemBuilder().setLabel('<' + i18n('action.select') + '>').setTabId(
                new AppBarTabId('hidden', '____home')).build();
            browseMenuItem.setVisibleInMenu(false);
            this.addNavigablePanel(browseMenuItem, browsePanel);

            this.currentKeyBindings = Action.getKeyBindings(browsePanel.getActions());
            this.activateCurrentKeyBindings();
        }
    }

    protected resolveActions(panel: Panel): Action[] {
        let actions = super.resolveActions(panel);
        return actions.concat(this.appBar.getActions());
    }

    private checkBrowsePanelNeedsToBeShown(index: number, panel: Panel) {
        if (panel === this.browsePanel && index > -1) {
            this.browsePanel = undefined;
        } else if (this.getSize() === 0) {
            // show browse panel if all others were removed
            new ShowBrowsePanelEvent().fire();
        }
    }
}
