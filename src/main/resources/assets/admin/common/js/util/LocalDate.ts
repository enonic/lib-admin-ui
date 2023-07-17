import {DateHelper} from './DateHelper';
import {StringHelper} from './StringHelper';
import {Equitable} from '../Equitable';
import {ObjectHelper} from '../ObjectHelper';

export class LocalDate
    implements Equitable {

    private readonly year: number;

    private readonly month: number; // 0-11

    private readonly day: number;

    constructor(builder: LocalDateBuilder) {
        this.year = builder.year;
        this.month = builder.month;
        this.day = builder.day;
    }

    // expects iso-like string, months should be in range of 1-12
    static isValidISODateString(s: string): boolean {
        if (StringHelper.isBlank(s)) {
            return false;
        }
        //matches 2015-02-29
        let re = /^([12]\d{3})(\-)([0]{1}\d{1}|[1]{1}[0-2]{1})(\-)([0-2]{1}\d{1}|[3]{1}[0-1]{1})$/;
        return re.test(s);
    }

    static fromDate(date: Date): LocalDate {
        if (!date) {
            return null;
        }

        return LocalDate.create().setYear(date.getFullYear()).setMonth(date.getMonth()).setDay(date.getDate()).build();
    }

    static fromISOString(s: string): LocalDate {
        if (!LocalDate.isValidISODateString(s)) {
            throw new Error('Cannot parse LocalDate from string: ' + s);
        }

        let date: string[] = s.split(DateHelper.DATE_SEPARATOR);
        return LocalDate.create().setYear(Number(date[0])).setMonth(Number(date[1]) - 1).setDay(Number(date[2])).build();
    }

    public static create(): LocalDateBuilder {
        return new LocalDateBuilder();
    }

    getYear(): number {
        return this.year;
    }

    getMonth(): number {
        return this.month;
    }

    getDay(): number {
        return this.day;
    }

    equals(o: Equitable): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(o, LocalDate)) {
            return false;
        }
        let other = o as LocalDate;
        if (!ObjectHelper.stringEquals(this.toString(), other.toString())) {
            return false;
        }
        return true;
    }

    /** Returns date in ISO format. Month value is incremented because ISO month range is 1-12, whereas JS Date month range is 0-11 */
    toString(): string {
        return this.year + DateHelper.DATE_SEPARATOR + this.padNumber(this.month + 1) + DateHelper.DATE_SEPARATOR +
               this.padNumber(this.day);
    }

    toDate(): Date {
        return DateHelper.parseDate(this.toString(), DateHelper.DATE_SEPARATOR);
    }

    private padNumber(num: number, length: number = 2): string {
        let numAsString = String(num);

        while (numAsString.length < length) {
            numAsString = '0' + numAsString;
        }
        return numAsString;
    }

}

export class LocalDateBuilder {
    year: number;

    month: number;

    day: number;

    setYear(value: number): LocalDateBuilder {
        this.year = value;
        return this;
    }

    setMonth(value: number): LocalDateBuilder {
        this.month = value;
        return this;
    }

    setDay(value: number): LocalDateBuilder {
        this.day = value;
        return this;
    }

    validate() {
        if (!this.year) {
            throw new Error('Invalid parameter. Year should be set');
        } else if (this.month == null) {
            throw new Error('Invalid parameter. Month should be set');
        } else if (!this.day) {
            throw new Error('Invalid parameter. Day should be set');
        }
    }

    public build(): LocalDate {
        this.validate();
        return new LocalDate(this);
    }

}

