import {Event} from '../../event/Event';
import {ClassHelper} from '../../ClassHelper';

export class MinimizeWizardPanelEvent
    extends Event {

    static on(handler: (event: MinimizeWizardPanelEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: MinimizeWizardPanelEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }
}
