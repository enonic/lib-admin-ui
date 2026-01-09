import {Equitable} from '../Equitable';
import {StringHelper} from './StringHelper';
import {ObjectHelper} from '../ObjectHelper';

export class Instant
    implements Equitable {

    private static DATE_TIME_SEPARATOR: string = 'T';

    private static DATE_SEPARATOR: string = '-';

    private static TIME_SEPARATOR: string = ':';

    private static FRACTION_SEPARATOR: string = '.';

    private readonly year: number;

    private readonly month: number; // 0-11

    private readonly day: number;

    private readonly hours: number;

    private readonly minutes: number;

    private readonly seconds: number;

    private readonly fractions: number;

    constructor(builder: InstantBuilder) {
        this.year = builder.year;
        this.month = builder.month;
        this.day = builder.day;
        this.hours = builder.hours;
        this.minutes = builder.minutes;
        this.seconds = builder.seconds;
        this.fractions = builder.fractions;
    }

    static isValidInstant(s: string): boolean {
        if (StringHelper.isBlank(s)) {
            return false;
        }
        // Accepts ISO 8601 instant format (UTC only, with 'Z')
        const regex = /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])T([01]\d|2[0-3]):([0-5]\d):([0-5]\d)(\.\d{3})?Z$/;
        return regex.test(s);
    }

    /**
     * Parses passed string into Instant object
     * @param s - date to parse in ISO 8601 instant format (UTC, with 'Z')
     * @returns {Instant}
     */
    static fromString(s: string): Instant {
        if (!Instant.isValidInstant(s)) {
            throw new Error('Cannot parse Instant from string: ' + s);
        }

        const date = new Date(s);

        if (isNaN(date.getTime())) {
            throw new Error('Invalid date string for Instant: ' + s);
        }
        return Instant.create()
            .setYear(date.getUTCFullYear())
            .setMonth(date.getUTCMonth())
            .setDay(date.getUTCDate())
            .setHours(date.getUTCHours())
            .setMinutes(date.getUTCMinutes())
            .setSeconds(date.getUTCSeconds())
            .setFractions(date.getUTCMilliseconds())
            .build();
    }

    static fromDate(s: Date): Instant {
        return Instant.create()
            .setYear(s.getFullYear())
            .setMonth(s.getMonth())
            .setDay(s.getDate())
            .setHours(s.getHours())
            .setMinutes(s.getMinutes())
            .setSeconds(s.getSeconds())
            .setFractions(s.getMilliseconds())
            .build();
    }

    public static create(): InstantBuilder {
        return new InstantBuilder();
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

    getHours(): number {
        return this.hours;
    }

    getMinutes(): number {
        return this.minutes;
    }

    getSeconds(): number {
        return this.seconds || 0;
    }

    getFractions(): number {
        return this.fractions || 0;
    }

    dateToString(): string {
        return this.year +
               Instant.DATE_SEPARATOR + this.padNumber(this.month + 1) +
               Instant.DATE_SEPARATOR + this.padNumber(this.day);
    }

    timeToString(): string {
        let fractions = this.fractions ? Instant.FRACTION_SEPARATOR + this.padNumber(this.fractions, 3) : StringHelper.EMPTY_STRING;

        return this.padNumber(this.hours) + Instant.TIME_SEPARATOR +
               this.padNumber(this.minutes) + Instant.TIME_SEPARATOR +
               this.padNumber(this.seconds ? this.seconds : 0) + fractions;
    }

    toString(): string {
        return this.dateToString() + Instant.DATE_TIME_SEPARATOR + this.timeToString() + 'Z';
    }

    equals(o: Equitable): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(o, Instant)) {
            return false;
        }

        let other = o as Instant;

        if (!ObjectHelper.stringEquals(this.toString(), other.toString())) {
            return false;
        }

        return true;
    }

    toDate(): Date {
        return new Date(this.toString());
    }

    private padNumber(num: number, length: number = 2): string {
        let numAsString = String(num);

        while (numAsString.length < length) {
            numAsString = '0' + numAsString;
        }

        return numAsString;
    }
}

export class InstantBuilder {

    year: number;

    month: number;

    day: number;

    hours: number;

    minutes: number;

    seconds: number;

    fractions: number;

    public setYear(value: number): InstantBuilder {
        this.year = value;
        return this;
    }

    public setMonth(value: number): InstantBuilder {
        this.month = value;
        return this;
    }

    public setDay(value: number): InstantBuilder {
        this.day = value;
        return this;
    }

    public setHours(value: number): InstantBuilder {
        this.hours = value;
        return this;
    }

    public setMinutes(value: number): InstantBuilder {
        this.minutes = value;
        return this;
    }

    public setSeconds(value: number): InstantBuilder {
        this.seconds = value;
        return this;
    }

    public setFractions(value: number): InstantBuilder {
        if (this.seconds && value > 0) {
            this.fractions = value;
        }
        return this;
    }

    public build(): Instant {
        return new Instant(this);
    }
}
