import {parseRelativeTime} from '@enonic/ui-utils';
import dayjs from 'dayjs';
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
        return DateHelper.isoValueToDate(dayjs(parseRelativeTime(expr)), factory, omitTimezone, mode);
    }

    static parseToLocalDateTime(expr?: string): Date {
        return this.parseRelative(expr, LocalDateTime.fromString, true);
    }

    static parseToDateTime(expr?: string): Date {
        return this.parseRelative(expr, DateTime.fromString, false);
    }

    static parseToDate(expr?: string): Date {
        return this.parseRelative(expr, LocalDate.fromString, true, 'date');
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
