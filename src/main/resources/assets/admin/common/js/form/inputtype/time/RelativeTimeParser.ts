import dayjs, {Dayjs} from 'dayjs';
import {Instant as InstantUtil} from '../../../util/Instant';
import {DateTime as DateTimeUtil} from '../../../util/DateTime';

type IsoToDateFactory = (iso: string) => { toDate(): Date };

export class RelativeTimeParser {

    private static isoValueToDate(
        value: Dayjs | {
            year: () => number;
            month: () => number;
            date: () => number;
            hour: () => number;
            minute: () => number;
            second: () => number;
            millisecond: () => number
        },
        factory: IsoToDateFactory,
        omitTimezone = false
    ): Date {
        let isoString: string;

        if (omitTimezone) {
            const y = value.year().toString().padStart(4, '0');
            const m = (value.month() + 1).toString().padStart(2, '0'); // month() 0-based
            const d = value.date().toString().padStart(2, '0');
            const h = value.hour().toString().padStart(2, '0');
            const min = value.minute().toString().padStart(2, '0');
            const s = value.second().toString().padStart(2, '0');
            const ms = value.millisecond() ? `.${value.millisecond().toString().padStart(3, '0')}` : '';

            isoString = `${y}-${m}-${d}T${h}:${min}:${s}${ms}`;
        } else {
            isoString = (value as Dayjs).toISOString();
        }

        return factory(isoString).toDate();
    }

    private static parseRelative(
        expr: string,
        factory: IsoToDateFactory,
        omitTimezone = false
    ): Date {
        const base = dayjs();

        if (!expr || expr.trim() === 'now') {
            return this.isoValueToDate(base, factory, omitTimezone);
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

        return this.isoValueToDate(result, factory, omitTimezone);
    }

    static parseToDateTime(expr?: string): Date {
        return this.parseRelative(expr, DateTimeUtil.fromString, true);
    }

    static parseToInstant(expr?: string): Date {
        return this.parseRelative(expr, InstantUtil.fromString);
    }
}
