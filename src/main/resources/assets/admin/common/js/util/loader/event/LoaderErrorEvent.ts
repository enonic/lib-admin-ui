import {LoaderEvent} from './LoaderEvent';

export class LoaderErrorEvent
    extends LoaderEvent {

    private statusCode: number;
    private textStatus: string;

    constructor(statusCode: number, textStatus: string, postLoad: boolean = false) {
        super(postLoad);
        this.statusCode = statusCode;
        this.textStatus = textStatus;
    }

    getStatusCode(): number {
        return this.statusCode;
    }

    getTextStatus(): string {
        return this.textStatus;
    }
}
