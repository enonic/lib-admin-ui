import {TimeHM} from './TimeHM';

export class TimeHMS extends TimeHM {

    readonly seconds?: number;

    constructor(hours: number, minutes: number, seconds: number) {
        super(hours, minutes);

        this.seconds = seconds;
    }
}
