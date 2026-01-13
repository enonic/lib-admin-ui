import dayjs, {Dayjs} from 'dayjs';
import {Instant as InstantUtil} from '../../../util/Instant';
import {DateTime as DateTimeUtil} from '../../../util/DateTime';
import {DateHelper} from '../../../util/DateHelper';

export class RelativeTimeParser {

    private static parseRelative(
        expr: string,
        factory: (iso: string) => { toDate(): Date },
        omitTimezone = false
    ): Date {
        const base = dayjs();

        if (!expr || expr.trim() === 'now') {
            return DateHelper.isoValueToDate(base, factory, omitTimezone);
        }

        const result: Dayjs = expr
            .trim()
            .split(/\s+/)
            .reduce((date: Dayjs, token: any) => {
                const match = token.match(/^([+-])(\d+)([a-zA-Z]+)$/);
                if (!match) {
                    return date;
                }

                const [, sign, value, unit] = match;

                return sign === '+'
                       ? date.add(Number(value), unit)
                       : date.subtract(Number(value), unit);
            }, base);

        return DateHelper.isoValueToDate(result, factory, omitTimezone);
    }

    static parseToDateTime(expr?: string): Date {
        return this.parseRelative(expr, DateTimeUtil.fromString, true);
    }

    static parseToInstant(expr?: string): Date {
        return this.parseRelative(expr, InstantUtil.fromString);
    }
}
