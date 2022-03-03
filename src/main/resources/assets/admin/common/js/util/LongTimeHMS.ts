import {TimeHMS} from './TimeHMS';

export class LongTimeHMS extends TimeHMS {

    readonly fractions: number;

    constructor(hours: number, minutes: number, seconds: number, fractions: number) {
        super(hours, minutes, seconds);

        this.fractions = fractions;
    }
}
