import {DeckPanel} from '../ui/panel/DeckPanel';
import {BrowsePanel} from './browse/BrowsePanel';
import {KeyBinding} from '../ui/KeyBinding';
import {PanelShownEvent} from '../ui/panel/PanelShownEvent';
import {KeyBindings} from '../ui/KeyBindings';
import {Action} from '../ui/Action';
import {ShowBrowsePanelEvent} from './ShowBrowsePanelEvent';
import {Panel} from '../ui/panel/Panel';
import {ResponsiveManager} from '../ui/responsive/ResponsiveManager';

export class AppPanel
    extends DeckPanel {

    protected browsePanel: BrowsePanel;

    protected currentKeyBindings: KeyBinding[];

    constructor(className?: string) {
        super(className);

        this.onPanelShown(this.handlePanelShown.bind(this));

        this.handleGlobalEvents();
    }

    protected handleGlobalEvents() {
        ShowBrowsePanelEvent.on(() => this.handleBrowse());
    }

    handleBrowse() {
        if (!this.browsePanel) {
            this.addBrowsePanel(this.createBrowsePanel());
        }

        this.showPanel(this.browsePanel);

        ResponsiveManager.fireResizeEvent();
    }

    protected addBrowsePanel(browsePanel: BrowsePanel) {
        // limit to 1 browse panel
        if (!this.browsePanel) {
            this.browsePanel = browsePanel;
            this.addPanel(browsePanel);

            this.currentKeyBindings = Action.getKeyBindings(browsePanel.getActions());
            this.activateCurrentKeyBindings();
        }
    }

    protected activateCurrentKeyBindings() {
        if (this.currentKeyBindings) {
            KeyBindings.get().bindKeys(this.currentKeyBindings);
        }
    }

    protected createBrowsePanel(): BrowsePanel {
        throw new Error('Must be implemented by inheritors');
    }

    protected handlePanelShown(event: PanelShownEvent) {
        if (event.getPanel() === this.browsePanel) {
            this.browsePanel.refreshFilter();
        }

        let previousActions = this.resolveActions(event.getPreviousPanel());
        KeyBindings.get().unbindKeys(Action.getKeyBindings(previousActions));

        let nextActions = this.resolveActions(event.getPanel());
        this.currentKeyBindings = Action.getKeyBindings(nextActions);
        KeyBindings.get().bindKeys(this.currentKeyBindings);
    }

    protected resolveActions(panel: Panel): Action[] {
        return panel ? panel.getActions() : [];
    }

    unbindKeys() {
        if (!this.currentKeyBindings) {
            return;
        }

        KeyBindings.get().unbindKeys(this.currentKeyBindings);
    }

    bindKeys() {
        this.activateCurrentKeyBindings();
    }
}
