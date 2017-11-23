module api.app {

    export class AppPanel<M extends api.Equitable>
        extends api.ui.panel.DeckPanel {

        protected browsePanel: api.app.browse.BrowsePanel<M>;

        protected currentKeyBindings: api.ui.KeyBinding[];

        constructor(className?: string) {
            super(className);

            this.onPanelShown(this.handlePanelShown.bind(this));

            this.handleGlobalEvents();
        }

        private handlePanelShown(event: api.ui.panel.PanelShownEvent) {
            if (event.getPanel() === this.browsePanel) {
                this.browsePanel.refreshFilter();
            }

            let previousActions = this.resolveActions(event.getPreviousPanel());
            api.ui.KeyBindings.get().unbindKeys(api.ui.Action.getKeyBindings(previousActions));

            let nextActions = this.resolveActions(event.getPanel());
            this.currentKeyBindings = api.ui.Action.getKeyBindings(nextActions);
            api.ui.KeyBindings.get().bindKeys(this.currentKeyBindings);
        }

        protected handleGlobalEvents() {
            ShowBrowsePanelEvent.on(() => this.handleBrowse());

            window.onmessage = (e: MessageEvent) => {
                if (e.data.appLauncherEvent) {
                    let eventType: api.app.AppLauncherEventType = api.app.AppLauncherEventType[<string>e.data.appLauncherEvent];
                    if (eventType === api.app.AppLauncherEventType.Show) {
                        this.activateCurrentKeyBindings();
                    }
                }
            };
        }

        protected handleBrowse() {
            if (!this.browsePanel) {
                this.addBrowsePanel(this.createBrowsePanel());
            }

            this.showPanel(this.browsePanel);
        }

        protected addBrowsePanel(browsePanel: api.app.browse.BrowsePanel<M>) {
            // limit to 1 browse panel
            if (!this.browsePanel) {
                this.browsePanel = browsePanel;
                this.addPanel(browsePanel);

                this.currentKeyBindings = api.ui.Action.getKeyBindings(this.resolveActions(browsePanel));
                this.activateCurrentKeyBindings();
            }
        }

        protected activateCurrentKeyBindings() {
            if (this.currentKeyBindings) {
                api.ui.KeyBindings.get().bindKeys(this.currentKeyBindings);
            }
        }

        protected createBrowsePanel(): api.app.browse.BrowsePanel<M> {
            throw new Error('Must be implemented by inheritors');
        }
    }
}
