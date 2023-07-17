import {Equitable} from '../../Equitable';
import {ObjectHelper} from '../../ObjectHelper';

export class DayOfWeek
    implements Equitable {

    private numberCode: number;

    private oneLetterName: string;

    private shortName: string;

    private fullName: string;

    private previous: DayOfWeek;

    private next: DayOfWeek;

    constructor(numberCode: number, oneLetterName: string, shortName: string, fullName: string) {
        this.numberCode = numberCode;
        this.oneLetterName = oneLetterName;
        this.shortName = shortName;
        this.fullName = fullName;
        //this.previous = previoius;
        //this.next = next;
    }

    getNumberCode(): number {
        return this.numberCode;
    }

    getOneLetterName(): string {
        return this.oneLetterName;
    }

    getShortName(): string {
        return this.shortName;
    }

    getFullName(): string {
        return this.fullName;
    }

    getPrevioius(): DayOfWeek {
        return this.previous;
    }

    getNext(): DayOfWeek {
        return this.next;
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, DayOfWeek)) {
            return false;
        }

        let other = o as DayOfWeek;

        if (!ObjectHelper.numberEquals(this.numberCode, other.numberCode)) {
            return false;
        }

        return true;
    }
}
