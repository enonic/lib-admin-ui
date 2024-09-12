import {ActionContainer} from '../../ui/ActionContainer';
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

        const onNavigationItemAddedOrRemoved = () => {
            this.updateAppOpenTabs();
            this.toggleClass('tabs-present', this.tabMenu.countVisible() > 0);
        };

        this.tabMenu.onNavigationItemAdded(onNavigationItemAddedOrRemoved);
        this.tabMenu.onNavigationItemRemoved(onNavigationItemAddedOrRemoved);
    }

    getTabMenu(): AppBarTabMenu {
        return this.tabMenu;
    }

    private updateAppOpenTabs() {
        this.application.setOpenTabs(this.tabMenu.countVisible());
    }
}
