module api.app.bar {

    export class TabbedAppBar extends AppBar implements api.ui.ActionContainer {

        private tabMenu: AppBarTabMenu;

        constructor(application: Application) {
            super(application);

            this.tabMenu = new AppBarTabMenu();

            this.appendChild(this.tabMenu);

            this.tabMenu.onNavigationItemAdded(() => this.updateAppOpenTabs());
            this.tabMenu.onNavigationItemRemoved(() => this.updateAppOpenTabs());

            // Responsive events to update homeButton styles
            api.ui.responsive.ResponsiveManager.onAvailableSizeChanged(this, () => {
                if (this.tabMenu.countVisible() > 0) {
                    this.addClass('tabs-present');
                } else {
                    this.removeClass('tabs-present');
                }
            });
        }

        private updateAppOpenTabs() {
            this.application.setOpenTabs(this.tabMenu.countVisible());
        }

        getTabMenu(): AppBarTabMenu {
            return this.tabMenu;
        }
    }
}
