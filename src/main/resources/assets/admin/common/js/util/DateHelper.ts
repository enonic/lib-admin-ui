import {i18n} from './Messages';

export class DateHelper {

    public static isInvalidDate(value: Date): boolean {
        return isNaN(value.getTime());
    }

    public static getTZOffset(): number {
        return new Date().getTimezoneOffset() / -60;
    }

    // returns true if passed date uses daylight savings time
    public static isDST(date: Date): boolean {
        return Math.abs(date.getTimezoneOffset() / 60) > DateHelper.getTZOffset();
    }

    /**
     * Parses passed UTC string into Date object.
     * @param value
     * @returns {Date}
     */
    public static makeDateFromUTCString(value: string): Date {

        let parsedYear: number = Number(value.substring(0, 4));
        let parsedMonth: number = Number(value.substring(5, 7));
        let parsedDayOfMonth: number = Number(value.substring(8, 10));
        let parsedHours: number = Number(value.substring(11, 13));
        let parsedMinutes: number = Number(value.substring(14, 16));
        let parsedSeconds: number = Number(value.substring(17, 19));

        return new Date(Date.UTC(parsedYear, parsedMonth - 1, parsedDayOfMonth, parsedHours, parsedMinutes, parsedSeconds));
    }

    /**
     * Formats date part of passed date object. Returns string like 2010-01-01
     * @param date
     * @returns {string}
     */
    public static formatDate(date: Date): string {
        let yearAsString = '' + date.getFullYear();
        return yearAsString + '-' + this.padNumber(date.getMonth() + 1) + '-' + this.padNumber(date.getDate());
    }

    /**
     * Formats date and time parts of passed date object. Returns string like 2010-01-01 12:34
     * @param date
     * @returns {string}
     */
    public static formatDateTime(date: Date, includeSeconds: boolean = true): string {
        return `${DateHelper.formatDate(date)} ${DateHelper.getFormattedTimeFromDate(date, includeSeconds)}`;
    }

    /**
     * Formats time part of passed date object. Returns string like 10:55:00
     * @param date
     * @param includeSeconds
     * @returns {string}
     */
    public static getFormattedTimeFromDate(date: Date, includeSeconds: boolean = true): string {
        return DateHelper.padNumber(date.getHours()) + ':' + DateHelper.padNumber(date.getMinutes()) +
               (includeSeconds ? ':' + DateHelper.padNumber(date.getSeconds()) : '');
    }

    /**
     * Returns Date object with only time part set
     * @param hours
     * @param minutes
     * @param seconds?
     * @returns {Date}
     */
    public static dateFromTime(hours: number, minutes: number, seconds?: number): Date {
        const now = new Date();

        if (!DateHelper.isHoursValid(hours) || !DateHelper.isMinutesValid(minutes) ||
            (!!seconds && !DateHelper.isMinutesValid(seconds))) {
            return now;
        }

        return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, seconds || 0);
    }

    /**
     * Formats hours, minutes and seconds into time string
     * @param hours
     * @param minutes
     * @param seconds?
     * @returns {string}
     */
    public static formatTime(hours: number, minutes: number, seconds?: number): string {
        if (!DateHelper.isHoursValid(hours) || !DateHelper.isMinutesValid(minutes) ||
            (!!seconds && !DateHelper.isMinutesValid(seconds))) {
            return '';
        }
        return DateHelper.padNumber(hours) + ':' + DateHelper.padNumber(minutes) +
               (seconds ? ':' + DateHelper.padNumber(seconds) : '');
    }

    public static isHoursValid(hours: number): boolean {
        return hours >= 0 && hours < 24;
    }

    public static isMinutesValid(minutes: number): boolean {
        return minutes >= 0 && minutes < 60;
    }

    public static padNumber(num: number): string {
        return ((num || 0) < 10 ? '0' : '') + (num || 0);
    }

    /**
     * Parses passed iso-like string 2010-01-01 into js date,
     * month expected to be in a 1-12 range
     * @param date
     * @returns {string}
     */
    public static parseDate(value: string, dateSeparator: string = '-', forceDaysBeOfTwoChars: boolean = false): Date {
        let dateStr = (value || '').trim();
        if (dateStr.length < 8 || dateStr.length > 10) {
            return null;
        }
        let parts = dateStr.split(dateSeparator);
        if (parts.length !== 3 || parts[0].length !== 4) {
            return null;
        }

        if (forceDaysBeOfTwoChars && parts[2].length !== 2) {
            return null;
        }

        let parsedYear: number = Number(parts[0]);
        let parsedMonth: number = Number(parts[1]);
        let parsedDayOfMonth: number = Number(parts[2]);

        let date = new Date(parsedYear, parsedMonth - 1, parsedDayOfMonth);
        return date.getFullYear() === parsedYear && date.getMonth() === (parsedMonth - 1) && date.getDate() === parsedDayOfMonth
               ? date
               : null;
    }

    /**
     * Parses passed value into Date object. Expected length is 14-16 chars, value should be like '2015-04-17 06:00'
     * @param value
     * @returns {*}
     */
    static parseDateTime(value: string): Date {
        let dateStr = (value || '').trim();
        if (dateStr.length < 14 || dateStr.length > 16) {
            return null;
        }
        let parts = dateStr.split(' ');
        if (parts.length !== 2) {
            return null;
        }
        let datePart = parts[0];
        let timePart = parts[1];
        let date = DateHelper.parseDate(datePart);
        if (!date) {
            return null;
        }
        let time = DateHelper.parseTime(timePart);
        if (!time) {
            return null;
        }
        date.setHours(time.hour, time.minute, 0, 0);
        return date;
    }

    /**
     * Parses passed string with use of given separators. Passed string should not contain timezone.
     * @param value
     * @param dateTimeSeparator
     * @param dateSeparator
     * @param timeSeparator
     * @param fractionSeparator
     * @returns {*}
     */
    static parseLongDateTime(value: string, dateTimeSeparator: string = '-', dateSeparator: string = '-', timeSeparator: string = ':',
                             fractionSeparator: string = '.'): Date {
        let dateStr = (value || '').trim();

        let parts = dateStr.split(dateTimeSeparator);
        if (parts.length !== 2) {
            return null;
        }
        let datePart = parts[0];
        let timePart = parts[1];

        let date = DateHelper.parseDate(datePart, dateSeparator);
        if (!date) {
            return null;
        }
        let time = DateHelper.parseLongTime(timePart, timeSeparator, fractionSeparator);
        if (!time) {
            return null;
        }
        date.setHours(time.hours, time.minutes, time.seconds, time.fractions);

        return date;
    }

    /**
     * Returns true if passed string ends with 'z'
     * @param value
     * @returns {number}
     */
    static isUTCdate(value: string): boolean {
        if (value != null && (value[value.length - 1] === 'Z' || value[value.length - 1] === 'z')) {
            return true;
        }
        return false;
    }

    /**
     * E.g. numDaysInMonth(2015, 1) -> 28
     * @param year
     * @param month 0 based month number of the year. 0 === January , 11 === December
     * @returns {number}
     */
    static numDaysInMonth(year: number, month: number): number {
        return new Date(year, month + 1, 0).getDate();
    }

    static getModifiedString(modified: Date): string {
        let timeDiff = Math.abs(Date.now() - modified.getTime());
        let secInMs = 1000;
        let minInMs = secInMs * 60;
        let hrInMs = minInMs * 60;
        let dayInMs = hrInMs * 24;
        let monInMs = dayInMs * 31;
        let yrInMs = dayInMs * 365;

        if (timeDiff < minInMs) {
            return i18n('field.lessthanminuteago');
        }
        if (timeDiff < 2 * minInMs) {
            return i18n('field.minuteago');
        }
        if (timeDiff < hrInMs) {
            return i18n('field.minutesago', ~~(timeDiff / minInMs));
        }
        if (timeDiff < 2 * hrInMs) {
            return i18n('field.overhourago');
        }
        if (timeDiff < dayInMs) {
            return i18n('field.overhoursago', ~~(timeDiff / hrInMs));
        }
        if (timeDiff < 2 * dayInMs) {
            return i18n('field.overdayago');
        }
        if (timeDiff < monInMs) {
            return i18n('field.overdayssago', ~~(timeDiff / dayInMs));
        }
        if (timeDiff < 2 * monInMs) {
            return i18n('field.overmonthago');
        }
        if (timeDiff < yrInMs) {
            return i18n('field.overmonthsago', ~~(timeDiff / monInMs));
        }
        if (timeDiff < 2 * yrInMs) {
            return i18n('field.overyearago');
        }

        return i18n('field.overyearsago', ~~(timeDiff / yrInMs));
    }

    /**
     * Parses passed value to Time object. Expected format is only 5 chars like '12:10'
     * @param value
     * @returns {*}
     */
    private static parseTime(value: string): Time {
        let dateStr = (value || '').trim();
        if (dateStr.length !== 5) {
            return null;
        }
        let parts = dateStr.split(':');
        if (parts.length !== 2) {
            return null;
        }
        let hour: number = Number(parts[0]);
        let minute: number = Number(parts[1]);
        if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
            return null;
        }
        return {hour: hour, minute: minute};
    }

    private static parseLongTime(value: string, timeSeparator: string = ':', fractionSeparator: string = '.'): LongTime {
        let timeStr = (value || '').trim();
        if (timeStr.length < 5 || timeStr.length > 12) {
            return null;
        }
        let time: string[] = timeStr.split(timeSeparator);

        if (time.length < 2 || time.length > 3) {
            return null;
        }

        let hours = Number(time[0]);
        let minutes = Number(time[1]);
        let seconds: number = 0;
        let fractions: number = 0;

        if (time[2]) {
            let secondArr: string[] = time[2].split(fractionSeparator);
            seconds = Number(secondArr[0]);
            if (secondArr[1]) {
                fractions = Number(secondArr[1]);
            }
        }

        if (isNaN(hours) || isNaN(minutes) || isNaN(seconds) || isNaN(fractions) ||
            hours < 0 || hours > 23 || minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59 || fractions < 0) {
            return null;
        }

        return {
            hours: hours,
            minutes: minutes,
            seconds: seconds,
            fractions: fractions
        };
    }
}

interface Time {
    hour: number;
    minute: number;
}

interface LongTime {
    hours: number;
    minutes: number;
    seconds: number;
    fractions: number;
}
