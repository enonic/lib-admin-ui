import {ActionContainer} from '../../ui/ActionContainer';
import {ResponsiveManager} from '../../ui/responsive/ResponsiveManager';
import {AppBar} from './AppBar';
import {AppBarTabMenu} from './AppBarTabMenu';
import {AppApplication} from '../AppApplication';

export class TabbedAppBar
    extends AppBar
    implements ActionContainer {

    private tabMenu: AppBarTabMenu;

    constructor(application: AppApplication) {
        super(application);

        this.tabMenu = new AppBarTabMenu();

        this.appendChild(this.tabMenu);

        this.tabMenu.onNavigationItemAdded(() => this.updateAppOpenTabs());
        this.tabMenu.onNavigationItemRemoved(() => this.updateAppOpenTabs());

        // Responsive events to update homeButton styles
        ResponsiveManager.onAvailableSizeChanged(this, () => {
            if (this.tabMenu.countVisible() > 0) {
                this.addClass('tabs-present');
            } else {
                this.removeClass('tabs-present');
            }
        });
    }

    getTabMenu(): AppBarTabMenu {
        return this.tabMenu;
    }

    private updateAppOpenTabs() {
        this.application.setOpenTabs(this.tabMenu.countVisible());
    }
}
