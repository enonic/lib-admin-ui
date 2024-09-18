import {ClassHelper} from '../../ClassHelper';
import {Event} from '../../event/Event';

export class EnonicAiContentOperatorOpenDialogEvent
    extends Event {

    private readonly sourceDataPath?: string;

    constructor(dataPath?: string) {
        super();

        this.sourceDataPath = dataPath;
    }

    getSourceDataPath(): string | undefined {
        return this.sourceDataPath;
    }

    static on(handler: (event: EnonicAiContentOperatorOpenDialogEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: EnonicAiContentOperatorOpenDialogEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }

}
