import {ClassHelper} from '../../ClassHelper';
import {Event} from '../../event/Event';

export class AiContentOperatorOpenDialogEvent
    extends Event {

    private readonly sourceDataPath?: string;

    constructor(dataPath?: string) {
        super();

        this.sourceDataPath = dataPath;
    }

    getSourceDataPath(): string | undefined {
        return this.sourceDataPath;
    }

    static on(handler: (event: AiContentOperatorOpenDialogEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: AiContentOperatorOpenDialogEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }

}
