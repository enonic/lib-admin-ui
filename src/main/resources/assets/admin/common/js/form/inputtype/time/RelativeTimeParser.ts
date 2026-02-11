import dayjs, {Dayjs} from 'dayjs';
import {Instant} from '../../../util/Instant';
import {DateTime} from '../../../util/DateTime';
import {DateHelper} from '../../../util/DateHelper';
import {LocalDate} from '../../../util/LocalDate';

export class RelativeTimeParser {

    private static parseRelative(
        expr: string,
        factory: (iso: string) => { toDate(): Date },
        omitTimezone = true,
        mode: 'datetime' | 'date' | 'time' = 'datetime'
    ): Date {
        const base = dayjs();

        if (!expr || expr.trim() === 'now') {
            return DateHelper.isoValueToDate(base, factory, omitTimezone, mode);
        }

        const result: Dayjs = expr
            .trim()
            .split(/\s+/)
            .reduce((date: Dayjs, token: string) => {
                const match = token.match(/^([+-])(\d+)([a-zA-Z]+)$/);
                if (!match) {
                    return date;
                }

                const [, sign, value, unit] = match;

                return sign === '+'
                       ? date.add(Number(value), unit as dayjs.ManipulateType)
                       : date.subtract(Number(value), unit as dayjs.ManipulateType);
            }, base);

        return DateHelper.isoValueToDate(result, factory, omitTimezone, mode);
    }

    static parseToDateTime(expr?: string): Date {
        return this.parseRelative(expr, DateTime.fromString, true);
    }

    static parseToInstant(expr?: string): Date {
        return this.parseRelative(expr, Instant.fromString, false);
    }

    static parseToDate(expr?: string): Date {
        return this.parseRelative(expr, LocalDate.fromISOString, true, 'date');
    }

    static parseToTime(expr?: string): Date {
        return this.parseRelative(expr, (iso: string) => ({
            toDate: () => {
                const time = DateHelper.parseTime(iso);
                return DateHelper.dateFromTime(time.hours, time.minutes);
            }
        }), true, 'time');
    }
}
