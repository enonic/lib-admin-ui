import {Event} from '../../event/Event';
import {ClassHelper} from '../../ClassHelper';
import {ContentSummary} from '../ContentSummary';

export class FormEditEvent
    extends Event {

    private model: ContentSummary;

    constructor(model: ContentSummary) {
        super();
        this.model = model;
    }

    static on(handler: (event: FormEditEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: FormEditEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    getModels(): ContentSummary {
        return this.model;
    }
}
