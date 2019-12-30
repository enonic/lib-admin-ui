import {StringHelper} from './StringHelper';
import {Equitable} from '../Equitable';
import {ObjectHelper} from '../ObjectHelper';

export class LocalTime
    implements Equitable {

    private static TIME_SEPARATOR: string = ':';

    private hours: number;

    private minutes: number;

    private seconds: number;

    constructor(builder: LocalTimeBuilder) {
        this.hours = builder.hours;
        this.minutes = builder.minutes;
        this.seconds = builder.seconds;
    }

    static isValidString(s: string): boolean {
        if (StringHelper.isBlank(s)) {
            return false;
        }
        // looks for strings like '12', '1:19', '21:05', '6:7', '15:9:8', '6:59:29'
        let re = /^(\d{1}|[0-1]{1}\d{1}|[2]{1}[0-3]{1})((?::)(\d{1}|[0-5]{1}\d{1}))?((?::)(\d{1}|[0-5]{1}\d{1}))?$/;
        return re.test(s);
    }

    static fromString(s: string): LocalTime {
        if (!LocalTime.isValidString(s)) {
            throw new Error('Cannot parse LocalTime from string: ' + s);
        }
        let localTime: string[] = s.split(':');
        let hours = Number(localTime[0]);
        let minutes = Number(localTime[1]) || 0;
        let seconds = localTime.length > 2 ? Number(localTime[2]) : 0;

        return LocalTime.create()
            .setHours(hours)
            .setMinutes(minutes)
            .setSeconds(seconds)
            .build();
    }

    static fromDate(date: Date): LocalTime {

        return LocalTime.create()
            .setHours(date.getHours())
            .setMinutes(date.getMinutes())
            .setSeconds(date.getSeconds())
            .build();
    }

    public static create(): LocalTimeBuilder {
        return new LocalTimeBuilder();
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

    toString(): string {
        let strSeconds = this.seconds ? LocalTime.TIME_SEPARATOR + this.padNumber(this.seconds) : StringHelper.EMPTY_STRING;

        return this.padNumber(this.hours) + LocalTime.TIME_SEPARATOR + this.padNumber(this.minutes) + strSeconds;
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, LocalTime)) {
            return false;
        }

        let other = <LocalTime>o;

        if (!ObjectHelper.numberEquals(this.getHours(), other.getHours())) {
            return false;
        }
        if (!ObjectHelper.numberEquals(this.getMinutes(), other.getMinutes())) {
            return false;
        }
        if (!ObjectHelper.numberEquals(this.getSeconds(), other.getSeconds())) {
            return false;
        }
        return true;
    }

    public getAdjustedTime(): { hour: number; minute: number; seconds: number } {
        let date = new Date();
        date.setHours(this.getHours(), this.getMinutes(), this.getSeconds());

        return {
            hour: date.getHours(),
            minute: date.getMinutes(),
            seconds: date.getSeconds()
        };
    }

    private padNumber(num: number): string {
        return (num < 10 ? '0' : '') + num;
    }

}

export class LocalTimeBuilder {

    hours: number;

    minutes: number;

    seconds: number;

    public setHours(value: number): LocalTimeBuilder {
        this.hours = value;
        return this;
    }

    public setMinutes(value: number): LocalTimeBuilder {
        this.minutes = value;
        return this;
    }

    public setSeconds(value: number): LocalTimeBuilder {
        this.seconds = value;
        return this;
    }

    public build(): LocalTime {
        return new LocalTime(this);
    }
}
