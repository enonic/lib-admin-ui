import {DateHelper} from './DateHelper';
import {StringHelper} from './StringHelper';
import {Equitable} from '../Equitable';
import {ObjectHelper} from '../ObjectHelper';

export class LocalDateTime
    implements Equitable {

    private static readonly PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/;

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

    constructor(builder: LocalDateTimeBuilder) {
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
     * Parsed passed string into DateTime object
     * @param s - date to parse in ISO format
     * @returns {DateTime}
     */
    static fromString(s: string): LocalDateTime {
        if (!LocalDateTime.isValidDateTime(s)) {
            throw new Error('Cannot parse LocalDateTime from string: ' + s);
        }

        const date = DateHelper.parseLongDateTime(s,
            LocalDateTime.DATE_TIME_SEPARATOR,
            LocalDateTime.DATE_SEPARATOR,
            LocalDateTime.TIME_SEPARATOR,
            LocalDateTime.FRACTION_SEPARATOR
        );

        if (!date) {
            throw new Error('Cannot parse LocalDateTime from string: ' + s);
        }

        return LocalDateTime.fromDate(date);
    }

    static fromDate(date: Date): LocalDateTime {
        return LocalDateTime.create()
            .setYear(date.getFullYear())
            .setMonth(date.getMonth())
            .setDay(date.getDate())
            .setHours(date.getHours())
            .setMinutes(date.getMinutes())
            .setSeconds(date.getSeconds())
            .setFractions(date.getMilliseconds())
            .build();
    }

    public static create(): LocalDateTimeBuilder {
        return new LocalDateTimeBuilder();
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
        return this.year + LocalDateTime.DATE_SEPARATOR + this.padNumber(this.month + 1) + LocalDateTime.DATE_SEPARATOR +
               this.padNumber(this.day);
    }

    timeToString(): string {
         
        let fractions = this.fractions ? LocalDateTime.FRACTION_SEPARATOR + this.padNumber(this.fractions, 3) : StringHelper.EMPTY_STRING;

        return this.padNumber(this.hours) + LocalDateTime.TIME_SEPARATOR +
               this.padNumber(this.minutes) + LocalDateTime.TIME_SEPARATOR +
               this.padNumber(this.seconds ? this.seconds : 0) + fractions;
    }

    toString(): string {
        return this.dateToString() + LocalDateTime.DATE_TIME_SEPARATOR + this.timeToString();
    }

    equals(o: Equitable): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(o, LocalDateTime)) {
            return false;
        }

        let other = o as LocalDateTime;

        if (!ObjectHelper.stringEquals(this.toString(), other.toString())) {
            return false;
        }

        return true;
    }

    toDate(): Date {
        return DateHelper.parseLongDateTime(this.toString(), LocalDateTime.DATE_TIME_SEPARATOR, LocalDateTime.DATE_SEPARATOR,
            LocalDateTime.TIME_SEPARATOR, LocalDateTime.FRACTION_SEPARATOR);
    }

    private padNumber(num: number, length: number = 2): string {
        let numAsString = String(num);

        while (numAsString.length < length) {
            numAsString = '0' + numAsString;
        }

        return numAsString;
    }
}

export class LocalDateTimeBuilder {

    year: number;

    month: number;

    day: number;

    hours: number;

    minutes: number;

    seconds: number;

    fractions: number;

    public setYear(value: number): LocalDateTimeBuilder {
        this.year = value;
        return this;
    }

    public setMonth(value: number): LocalDateTimeBuilder {
        this.month = value;
        return this;
    }

    public setDay(value: number): LocalDateTimeBuilder {
        this.day = value;
        return this;
    }

    public setHours(value: number): LocalDateTimeBuilder {
        this.hours = value;
        return this;
    }

    public setMinutes(value: number): LocalDateTimeBuilder {
        this.minutes = value;
        return this;
    }

    public setSeconds(value: number): LocalDateTimeBuilder {
        this.seconds = value;
        return this;
    }

    public setFractions(value: number): LocalDateTimeBuilder {
        if (this.seconds && value > 0) {
            this.fractions = value;
        }
        return this;
    }

    public build(): LocalDateTime {
        return new LocalDateTime(this);
    }
}
