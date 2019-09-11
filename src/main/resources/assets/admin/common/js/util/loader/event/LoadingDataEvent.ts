import {LoaderEvent} from './LoaderEvent';

export class LoadingDataEvent
    extends LoaderEvent {

    constructor(postLoad: boolean = false) {
        super(postLoad);
    }

}
