import dayjs, {Dayjs} from 'dayjs';
import {DateTime} from '../../../util/DateTime';
import {DateHelper} from '../../../util/DateHelper';
import {LocalDate} from '../../../util/LocalDate';
import {LocalDateTime} from '../../../util/LocalDateTime';

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

    static parseToLocalDateTime(expr?: string): Date {
        return this.parseRelative(expr, LocalDateTime.fromString, true);
    }

    static parseToDateTime(expr?: string): Date {
        return this.parseRelative(expr, DateTime.fromString, false);
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
