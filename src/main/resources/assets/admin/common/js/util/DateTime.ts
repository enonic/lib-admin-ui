import {Equitable} from '../Equitable';
import {StringHelper} from './StringHelper';
import {ObjectHelper} from '../ObjectHelper';

export class DateTime
    implements Equitable {

    private static readonly PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?Z$/;

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

    constructor(builder: DateTimeBuilder) {
        this.year = builder.year;
        this.month = builder.month;
        this.day = builder.day;
        this.hours = builder.hours;
        this.minutes = builder.minutes;
        this.seconds = builder.seconds;
        this.fractions = builder.fractions;
    }

    static isValidDateTime(s: string): boolean {
        if (StringHelper.isBlank(s)) {
            return false;
        }

        return this.PATTERN.test(s);
    }

    /**
     * Parses passed string into DateTime object
     * @param s - date to parse in ISO 8601 instant format (UTC, with 'Z')
     * @returns {DateTime}
     */
    static fromString(s: string): DateTime {
        if (!DateTime.isValidDateTime(s)) {
            throw new Error('Cannot parse Instant from string: ' + s);
        }

        const date = new Date(s);

        if (isNaN(date.getTime())) {
            throw new Error('Invalid date string for Instant: ' + s);
        }

        return DateTime.fromDate(date);
    }

    static fromDate(s: Date): DateTime {
        return DateTime.create()
            .setYear(s.getUTCFullYear())
            .setMonth(s.getUTCMonth())
            .setDay(s.getUTCDate())
            .setHours(s.getUTCHours())
            .setMinutes(s.getUTCMinutes())
            .setSeconds(s.getUTCSeconds())
            .setFractions(s.getUTCMilliseconds())
            .build();
    }

    public static create(): DateTimeBuilder {
        return new DateTimeBuilder();
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
               DateTime.DATE_SEPARATOR + this.padNumber(this.month + 1) +
               DateTime.DATE_SEPARATOR + this.padNumber(this.day);
    }

    timeToString(): string {
        let fractions = this.fractions
                        ? DateTime.FRACTION_SEPARATOR + this.fractions.toString().padStart(3, '0')
                        : StringHelper.EMPTY_STRING;

        return this.padNumber(this.hours) + DateTime.TIME_SEPARATOR +
               this.padNumber(this.minutes) + DateTime.TIME_SEPARATOR +
               this.padNumber(this.seconds ? this.seconds : 0) + fractions;
    }

    toString(): string {
        return this.dateToString() + DateTime.DATE_TIME_SEPARATOR + this.timeToString() + 'Z';
    }

    equals(o: Equitable): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(o, DateTime)) {
            return false;
        }

        let other = o as DateTime;

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

export class DateTimeBuilder {

    year: number;

    month: number;

    day: number;

    hours: number;

    minutes: number;

    seconds: number;

    fractions: number;

    public setYear(value: number): DateTimeBuilder {
        this.year = value;
        return this;
    }

    public setMonth(value: number): DateTimeBuilder {
        this.month = value;
        return this;
    }

    public setDay(value: number): DateTimeBuilder {
        this.day = value;
        return this;
    }

    public setHours(value: number): DateTimeBuilder {
        this.hours = value;
        return this;
    }

    public setMinutes(value: number): DateTimeBuilder {
        this.minutes = value;
        return this;
    }

    public setSeconds(value: number): DateTimeBuilder {
        this.seconds = value;
        return this;
    }

    public setFractions(value: number): DateTimeBuilder {
        if (value > 0) {
            this.fractions = value;
        }
        return this;
    }

    public build(): DateTime {
        return new DateTime(this);
    }
}
