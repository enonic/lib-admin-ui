module api.util {

    export class DateTimeRange
        implements api.Equitable {

        private from: DateTime;

        private to: DateTime;

        constructor(from: DateTime, to: DateTime) {
            this.from = from;
            this.to = to;
        }

        getFrom(): api.util.DateTime {
            return this.from;
        }

        getTo(): api.util.DateTime {
            return this.to;
        }

        setFrom(value: DateTime) {
            this.from = value;
        }

        setTo(value: DateTime) {
            this.to = value;
        }

        toString(): string {
            return `${this.from},${this.to}`;
        }

        equals(o: api.Equitable): boolean {

            if (!api.ObjectHelper.iFrameSafeInstanceOf(o, DateTimeRange)) {
                return false;
            }

            let other = <DateTimeRange>o;

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

            return DateTime.isValidDateTime(dates[0]) && DateTime.isValidDateTime(dates[1]);
        }

        static fromString(s: string): DateTimeRange {
            if (!DateTimeRange.isValidString(s)) {
                throw new Error('Cannot parse DateTimeRange from string: ' + s);
            }
            const dates: string[] = s.split(',');
            const from = DateTime.fromString(dates[0]);
            const to = DateTime.fromString(dates[1]);
            return new DateTimeRange(from, to);
        }
    }
}
