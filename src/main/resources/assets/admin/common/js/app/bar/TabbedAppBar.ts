import {ActionContainer} from '../../ui/ActionContainer';
import {ResponsiveManager} from '../../ui/responsive/ResponsiveManager';
import {AppBar} from './AppBar';
import {AppBarTabMenu} from './AppBarTabMenu';
import {Application} from '../Application';

export class TabbedAppBar
    extends AppBar
    implements ActionContainer {

    private tabMenu: AppBarTabMenu;

    constructor(application: Application, managedHomeIconAction: boolean = false) {
        super(application);

        this.tabMenu = new AppBarTabMenu();

        this.appendChild(this.tabMenu);

        this.tabMenu.onNavigationItemAdded(() => this.updateAppOpenTabs());
        this.tabMenu.onNavigationItemRemoved(() => this.updateAppOpenTabs());

        // Responsive events to update homeButton styles
        ResponsiveManager.onAvailableSizeChanged(this, () => {
            if (this.tabMenu.countVisible() > 0) {
                managedHomeIconAction && super.setHomeIconAction();
                this.addClass('tabs-present');
            } else {
                managedHomeIconAction && super.unsetHomeIconAction();
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
