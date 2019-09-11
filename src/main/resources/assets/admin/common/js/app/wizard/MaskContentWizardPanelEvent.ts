import {ContentId} from '../../content/ContentId';
import {Event} from '../../event/Event';
import {ClassHelper} from '../../ClassHelper';

export class MaskContentWizardPanelEvent
    extends Event {

    private contentId: ContentId;

    private mask: boolean;

    constructor(contentId: ContentId, mask: boolean = true) {
        super();

        this.contentId = contentId;
        this.mask = mask;
    }

    static on(handler: (event: MaskContentWizardPanelEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: MaskContentWizardPanelEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }

    isMask(): boolean {
        return this.mask;
    }

    getContentId(): ContentId {
        return this.contentId;
    }
}
