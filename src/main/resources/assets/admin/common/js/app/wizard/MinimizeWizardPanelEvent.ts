import {ClassHelper} from '../../ClassHelper';
import {IframeEvent} from '../../event/IframeEvent';

export class MinimizeWizardPanelEvent
    extends IframeEvent {

    static on(handler: (event: MinimizeWizardPanelEvent) => void) {
        IframeEvent.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: MinimizeWizardPanelEvent) => void) {
        IframeEvent.unbind(ClassHelper.getFullName(this), handler);
    }
}
