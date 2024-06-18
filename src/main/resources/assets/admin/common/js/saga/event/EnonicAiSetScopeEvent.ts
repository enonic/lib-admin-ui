import {ClassHelper} from '../../ClassHelper';
import {Event} from '../../event/Event';

export class EnonicAiSetScopeEvent
    extends Event {

    private readonly sourceDataPath?: string;

    constructor(dataPath?: string) {
        super();

        this.sourceDataPath = dataPath;
    }

    getSourceDataPath(): string | undefined {
        return this.sourceDataPath;
    }

    static on(handler: (event: EnonicAiSetScopeEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: EnonicAiSetScopeEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }

}
