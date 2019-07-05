module api.util {

    export class LocalDateTimeRange
        implements api.Equitable {

        private from: LocalDateTime;

        private to: LocalDateTime;

        constructor(from: LocalDateTime, to: LocalDateTime) {
            this.from = from;
            this.to = to;
        }

        getFrom(): LocalDateTime {
            return this.from;
        }

        getTo(): api.util.LocalDateTime {
            return this.to;
        }

        setFrom(value: LocalDateTime) {
            this.from = value;
        }

        setTo(value: LocalDateTime) {
            this.to = value;
        }

        toString(): string {
            return `${this.from},${this.to}`;
        }

        equals(o: api.Equitable): boolean {

            if (!api.ObjectHelper.iFrameSafeInstanceOf(o, LocalDateTimeRange)) {
                return false;
            }

            let other = <LocalDateTimeRange>o;

            if (!api.ObjectHelper.equals(this.from, other.from)) {
                return false;
            }

            if (!api.ObjectHelper.equals(this.to, other.to)) {
                return false;
            }
            return true;
        }

        static isValidString(s: string): boolean {
            if (StringHelper.isBlank(s)) {
                return false;
            }

            const indexOfComma = s.indexOf(',');
            if (indexOfComma < 1 || s.split(',').length !== 2) {
                return false;
            } else if (indexOfComma === s.length - 1) {
                return false;
            }

            const dates: string[] = s.split(',');

            return LocalDateTime.isValidDateTime(dates[0]) && LocalDateTime.isValidDateTime(dates[1]);
        }

        static fromString(s: string): LocalDateTimeRange {
            if (!LocalDateTimeRange.isValidString(s)) {
                throw new Error('Cannot parse LocalDateTimeRange from string: ' + s);
            }
            const dates: string[] = s.split(',');
            const from = LocalDateTime.fromString(dates[0]);
            const to = LocalDateTime.fromString(dates[1]);
            return new LocalDateTimeRange(from, to);
        }
    }
}
