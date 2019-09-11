import {Equitable} from '../Equitable';
import {DeckPanel} from '../ui/panel/DeckPanel';
import {BrowsePanel} from './browse/BrowsePanel';
import {KeyBinding} from '../ui/KeyBinding';
import {PanelShownEvent} from '../ui/panel/PanelShownEvent';
import {KeyBindings} from '../ui/KeyBindings';
import {Action} from '../ui/Action';
import {AppLauncherEventType} from './AppLauncherEventType';
import {ShowBrowsePanelEvent} from './ShowBrowsePanelEvent';

export class AppPanel<M extends Equitable>
    extends DeckPanel {

    protected browsePanel: BrowsePanel<M>;

    protected currentKeyBindings: KeyBinding[];

    constructor(className?: string) {
        super(className);

        this.onPanelShown(this.handlePanelShown.bind(this));

        this.handleGlobalEvents();
    }

    protected handleGlobalEvents() {
        ShowBrowsePanelEvent.on(() => this.handleBrowse());

        window.onmessage = (e: MessageEvent) => {
            if (e.data.appLauncherEvent) {
                let eventType: AppLauncherEventType = AppLauncherEventType[<string>e.data.appLauncherEvent];
                if (eventType === AppLauncherEventType.Show) {
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

    protected addBrowsePanel(browsePanel: BrowsePanel<M>) {
        // limit to 1 browse panel
        if (!this.browsePanel) {
            this.browsePanel = browsePanel;
            this.addPanel(browsePanel);

            this.currentKeyBindings = Action.getKeyBindings(this.resolveActions(browsePanel));
            this.activateCurrentKeyBindings();
        }
    }

    protected activateCurrentKeyBindings() {
        if (this.currentKeyBindings) {
            KeyBindings.get().bindKeys(this.currentKeyBindings);
        }
    }

    protected createBrowsePanel(): BrowsePanel<M> {
        throw new Error('Must be implemented by inheritors');
    }

    private handlePanelShown(event: PanelShownEvent) {
        if (event.getPanel() === this.browsePanel) {
            this.browsePanel.refreshFilter();
        }

        let previousActions = this.resolveActions(event.getPreviousPanel());
        KeyBindings.get().unbindKeys(Action.getKeyBindings(previousActions));

        let nextActions = this.resolveActions(event.getPanel());
        this.currentKeyBindings = Action.getKeyBindings(nextActions);
        KeyBindings.get().bindKeys(this.currentKeyBindings);
    }
}
