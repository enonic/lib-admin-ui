import Timezone = api.util.Timezone;
import DateTime = api.util.DateTime;

describe('DateTime', () => {

    let dateTime;
    let timeZone;

    describe('basic asserts', () => {

        beforeEach(() => {
            timeZone = Timezone.create().setOffset(1).build();
            dateTime =
                DateTime.create().setYear(2015).setMonth(3).setDay(25).setHours(12).setMinutes(5).setTimezone(timeZone).build();
        });

        it('should create an instance', () => {
            expect(dateTime).toBeDefined();
        });

        it('getYear() should return correct year', () => {
            expect(dateTime.getYear()).toEqual(2015);
        });

        it('getMonth() should return correct month', () => {
            expect(dateTime.getMonth()).toEqual(3);
        });

        it('getDay() should return correct day', () => {
            expect(dateTime.getDay()).toEqual(25);
        });

        it('getHours() should return correct hours', () => {
            expect(dateTime.getHours()).toEqual(12);
        });

        it('getMinutes() should return correct minutes', () => {
            expect(dateTime.getMinutes()).toEqual(5);
        });

        it('getSeconds() should return 0 when seconds are not passed to constructor', () => {
            expect(dateTime.getSeconds()).toEqual(0);
        });

        it('getFractions() should return 0 when fractions are not passed to constructor', () => {
            expect(dateTime.getFractions()).toEqual(0);
        });

        it('getFractions() should return 0 when seconds are not passed to constructor', () => {
            dateTime = DateTime.create().setYear(2015).setMonth(3).setDay(25).setHours(12).setMinutes(5).setFractions(256).build();

            expect(dateTime.getFractions()).toEqual(0);
        });

        it('getSeconds() should return correct seconds when passed to constructor', () => {
            dateTime = DateTime.create().setYear(2015).setMonth(3).setDay(25).setHours(12).setMinutes(5).setSeconds(37).build();

            expect(dateTime.getSeconds()).toEqual(37);
        });

        it('getFractions() should return correct value when both seconds and fractions are passed to constructor', () => {
            dateTime =
                DateTime.create().setYear(2015).setMonth(3).setDay(25).setHours(12).setMinutes(5).setSeconds(37).setFractions(
                    256).build();

            expect(dateTime.getFractions()).toEqual(256);
        });

        it('getFractions() should return correct value when both seconds and fractions are passed to constructor', () => {
            dateTime =
                DateTime.create().setYear(2015).setMonth(3).setDay(25).setHours(12).setMinutes(5).setSeconds(37).setFractions(
                    256).build();

            expect(dateTime.getFractions()).toEqual(256);
        });

        it('getTimezone().getOffset() should return correct value for timezone offset', () => {
            expect(dateTime.getTimezone().getOffset()).toEqual(1);
        });

        it('getTimezone().offsetToString() should return correctly padded value for offset', () => {
            expect(dateTime.getTimezone().offsetToString()).toEqual('+01:00');
        });
    });

    describe('negative offset toString()', () => {

        it('timeZone.toString() should return correctly padded value for offset', () => {
            timeZone = Timezone.create().setOffset(-1).build();
            expect((timeZone.getOffset())).toEqual(-1);
        });

        it('timeZone.toString() should return correctly padded value for offset', () => {
            timeZone = Timezone.create().setOffset(-1).build();
            expect(timeZone.toString()).toEqual('-01:00');
        });

        it('timeZone.toString() should return correctly padded value for offset', () => {
            timeZone = Timezone.create().setOffset(-11).build();
            expect(timeZone.toString()).toEqual('-11:00');
        });
    });

    describe('parse string with negative offset', () => {

        it('String with negative timezone should be parsed correctly', () => {
            dateTime = DateTime.fromString('2015-04-25T12:05:00-05:00');
            expect(dateTime.getTimezone().getOffset()).toEqual(-5);
            expect(dateTime.toString()).toEqual('2015-04-25T12:05:00-05:00');
        });

        it('String with no tz be parsed correctly', () => {
            dateTime = DateTime.fromString('2015-04-25T12:05:00');
            expect(dateTime.getTimezone().getOffset()).toEqual(0);
            expect(dateTime.toString()).toEqual('2015-04-25T12:05:00+00:00');
        });
    });

    describe('conversion to string', () => {

        it('should correctly convert when seconds, fractions and timezone not specified in constructor', () => {
            dateTime = DateTime.create().setYear(2015).setMonth(3).setDay(25).setHours(12).setMinutes(5).build();

            expect(dateTime.toString()).toEqual('2015-04-25T12:05:00+00:00');
        });

        it('should correctly convert with timezone', () => {
            timeZone = Timezone.create().setOffset(1).build();
            dateTime =
                DateTime.create().setYear(2015).setMonth(3).setDay(25).setHours(12).setMinutes(5).setSeconds(37).setTimezone(
                    timeZone).build();

            expect(dateTime.toString()).toEqual('2015-04-25T12:05:37+01:00');
        });

        it('should correctly convert with fractions and timezone', () => {
            timeZone = Timezone.create().setOffset(1).build();
            dateTime =
                DateTime.create().setYear(2015).setMonth(3).setDay(25).setHours(12).setMinutes(5).setSeconds(37).setFractions(
                    9).setTimezone(timeZone).build();

            expect(dateTime.toString()).toEqual('2015-04-25T12:05:37.009+01:00');
        });
    });

    describe('comparison', () => {

        it('should correctly compare equal dates', () => {
            let date1 = DateTime.create().setYear(2015).setMonth(3).setDay(25).setHours(12).setMinutes(5).build();
            let date2 = DateTime.create().setYear(2015).setMonth(3).setDay(25).setHours(12).setMinutes(5).build();

            expect(date1.equals(date2)).toBeTruthy();
        });

        it('should correctly compare unequal dates', () => {
            let date1 = DateTime.create().setYear(2015).setMonth(3).setDay(25).setHours(12).setMinutes(5).build();
            let date2 = DateTime.create().setYear(2015).setMonth(3).setDay(25).setHours(12).setMinutes(5).setSeconds(1).build();

            expect(date1.equals(date2)).toBeFalsy();
        });

        it('should correctly compare equal dates with different fraction part', () => {
            let date1 = DateTime.create().setYear(2015).setMonth(3).setDay(25).setHours(12).setMinutes(5).setSeconds(37).build();
            let date2 = DateTime.create().setYear(2015).setMonth(3).setDay(25).setHours(12).setMinutes(5).setSeconds(
                37).setFractions(0).build();

            expect(date1.equals(date2)).toBeTruthy();
        });

        it('should correctly compare equal dates with timezones', () => {
            timeZone = Timezone.create().setOffset(1).build();
            let date1 = DateTime.create().setYear(2015).setMonth(3).setDay(25).setHours(12).setMinutes(5).setSeconds(
                37).setTimezone(timeZone).build();
            let date2 = DateTime.create().setYear(2015).setMonth(3).setDay(25).setHours(12).setMinutes(5).setSeconds(
                37).setTimezone(timeZone).build();

            expect(date1.equals(date2)).toBeTruthy();
        });

        it('should correctly compare unequal dates with different timezones', () => {
            let timeZone1 = Timezone.create().setOffset(1).build();
            let timeZone2 = Timezone.create().setOffset(2).build();
            let date1 = DateTime.create().setYear(2015).setMonth(3).setDay(25).setHours(12).setMinutes(5).setSeconds(
                37).setTimezone(timeZone1).build();
            let date2 = DateTime.create().setYear(2015).setMonth(3).setDay(25).setHours(12).setMinutes(5).setSeconds(
                37).setTimezone(timeZone2).build();

            expect(date1.equals(date2)).toBeFalsy();
        });
    });

    describe('parsing of a date literal', () => {

        it('should not parse empty string', () => {
            expect(() => {
                DateTime.fromString('');
            }).toThrow();
        });

        it('should not parse value that is not a datetime', () => {
            expect(() => {
                DateTime.fromString('this is not a date');
            }).toThrow();
        });

        it('should not parse date without time part', () => {
            expect(() => {
                DateTime.fromString('2015-03-25');
            }).toThrow();
        });

        it('should not parse date with incorrect separators', () => {
            expect(() => {
                DateTime.fromString('2015.03.25T12:05:37.009');
            }).toThrow();
        });

        it('should not parse time with incorrect separators', () => {
            expect(() => {
                DateTime.fromString('2015-03-25T12.05.37.009');
            }).toThrow();
        });

        it('should not parse datetime with incorrect order of parts', () => {
            expect(() => {
                DateTime.fromString('25-03-2015T12:05:37.009');
            }).toThrow();
        });

        it('should not parse incorrect date', () => {
            expect(() => {
                DateTime.fromString('2015-02-29T12:05:37.009');
            }).toThrow();
        });

        it('should not parse incorrect time', () => {
            expect(() => {
                DateTime.fromString('2015-03-25T32:05:37.009');
            }).toThrow();
        });

        it('should not parse date with incorrect timezone', () => {
            expect(() => {
                DateTime.fromString('2015-03-25T32:05:37.009+25:00');
            }).toThrow();
        });

        it('should parse full datetime in correct format', () => {
            let parsedDate = DateTime.fromString('2015-03-25T12:05:37.009');
            let originalDate = DateTime.create().setYear(2015).setMonth(2).setDay(25).setHours(12).setMinutes(5).setSeconds(
                37).setFractions(9).build();

            expect(originalDate.equals(parsedDate)).toBeTruthy();
        });

        it('should parse datetime without fractions', () => {
            let parsedDate = DateTime.fromString('2015-03-25T12:05:37');
            let originalDate = DateTime.create().setYear(2015).setMonth(2).setDay(25).setHours(12).setMinutes(5).setSeconds(
                37).build();

            expect(originalDate.equals(parsedDate)).toBeTruthy();
        });

        it('should parse datetime without seconds and fractions', () => {
            let parsedDate = DateTime.fromString('2015-03-25T12:05');
            let originalDate = DateTime.create().setYear(2015).setMonth(2).setDay(25).setHours(12).setMinutes(5).build();

            expect(originalDate.equals(parsedDate)).toBeTruthy();
        });

        it('should parse datetime without timezone', () => {
            timeZone = Timezone.create().setOffset(1).build();
            let parsedDate = DateTime.fromString('2015-03-25T12:05+01:00');
            let originalDate = DateTime.create().setYear(2015).setMonth(2).setDay(25).setHours(12).setMinutes(5).setTimezone(
                timeZone).build();

            expect(originalDate.equals(parsedDate)).toBeTruthy();
        });
    });

    describe('half-hour timezone offsets', () => {

        it('should parse +05:30 offset correctly', () => {
            dateTime = DateTime.fromString('2015-04-25T12:05:00+05:30');
            expect(dateTime.getTimezone().getOffset()).toEqual(5.5);
            expect(dateTime.toString()).toEqual('2015-04-25T12:05:00+05:30');
        });

        it('should parse +05:45 offset correctly', () => {
            dateTime = DateTime.fromString('2015-04-25T12:05:00+05:45');
            expect(dateTime.getTimezone().getOffset()).toEqual(5.75);
            expect(dateTime.toString()).toEqual('2015-04-25T12:05:00+05:45');
        });

        it('should parse -09:30 offset correctly', () => {
            dateTime = DateTime.fromString('2015-04-25T12:05:00-09:30');
            expect(dateTime.getTimezone().getOffset()).toEqual(-9.5);
            expect(dateTime.toString()).toEqual('2015-04-25T12:05:00-09:30');
        });

        it('should render half-hour offset from builder correctly', () => {
            timeZone = Timezone.create().setOffset(5.5).build();
            expect(timeZone.toString()).toEqual('+05:30');
        });

        it('should render negative half-hour offset from builder correctly', () => {
            timeZone = Timezone.create().setOffset(-9.5).build();
            expect(timeZone.toString()).toEqual('-09:30');
        });
    });

    describe('UTC date parsing', () => {

        it('should convert UTC date to local time', () => {
            dateTime = DateTime.fromString('2015-01-01T12:00:00Z');
            let expectedDate = new Date(Date.UTC(2015, 0, 1, 12, 0, 0));
            expect(dateTime.getHours()).toEqual(expectedDate.getHours());
            expect(dateTime.getMinutes()).toEqual(expectedDate.getMinutes());
        });

        it('should set local timezone for UTC date', () => {
            dateTime = DateTime.fromString('2015-04-25T12:05:00Z');
            let expectedDate = new Date(Date.UTC(2015, 3, 25, 12, 5, 0));
            let expectedOffset = expectedDate.getTimezoneOffset() / -60;
            expect(dateTime.getTimezone().getOffset()).toEqual(expectedOffset);
        });
    });

    describe('DST transitions', () => {

        // These tests verify correct UTC-to-local conversion regardless of
        // whether the test machine is currently in winter or summer time.
        // Each test compares against a reference Date(Date.UTC(...)) which
        // JS converts to local time correctly, proving no double-correction.

        it('should correctly convert winter UTC date to local time', () => {
            // Deep winter — standard time in most timezones
            dateTime = DateTime.fromString('2015-01-15T14:30:00Z');
            let expected = new Date(Date.UTC(2015, 0, 15, 14, 30, 0));
            expect(dateTime.getYear()).toEqual(expected.getFullYear());
            expect(dateTime.getMonth()).toEqual(expected.getMonth());
            expect(dateTime.getDay()).toEqual(expected.getDate());
            expect(dateTime.getHours()).toEqual(expected.getHours());
            expect(dateTime.getMinutes()).toEqual(expected.getMinutes());
            expect(dateTime.getTimezone().getOffset()).toEqual(expected.getTimezoneOffset() / -60);
        });

        it('should correctly convert summer UTC date to local time', () => {
            // Deep summer — DST active in most timezones that observe it
            dateTime = DateTime.fromString('2015-07-15T14:30:00Z');
            let expected = new Date(Date.UTC(2015, 6, 15, 14, 30, 0));
            expect(dateTime.getYear()).toEqual(expected.getFullYear());
            expect(dateTime.getMonth()).toEqual(expected.getMonth());
            expect(dateTime.getDay()).toEqual(expected.getDate());
            expect(dateTime.getHours()).toEqual(expected.getHours());
            expect(dateTime.getMinutes()).toEqual(expected.getMinutes());
            expect(dateTime.getTimezone().getOffset()).toEqual(expected.getTimezoneOffset() / -60);
        });

        it('should correctly convert date just after spring-forward (EU)', () => {
            // 2015-03-29 01:00 UTC = moment CET springs forward to CEST
            dateTime = DateTime.fromString('2015-03-29T02:30:00Z');
            let expected = new Date(Date.UTC(2015, 2, 29, 2, 30, 0));
            expect(dateTime.getHours()).toEqual(expected.getHours());
            expect(dateTime.getMinutes()).toEqual(expected.getMinutes());
            expect(dateTime.getTimezone().getOffset()).toEqual(expected.getTimezoneOffset() / -60);
        });

        it('should correctly convert date just after fall-back (EU)', () => {
            // 2015-10-25 01:00 UTC = moment CEST falls back to CET
            dateTime = DateTime.fromString('2015-10-25T02:30:00Z');
            let expected = new Date(Date.UTC(2015, 9, 25, 2, 30, 0));
            expect(dateTime.getHours()).toEqual(expected.getHours());
            expect(dateTime.getMinutes()).toEqual(expected.getMinutes());
            expect(dateTime.getTimezone().getOffset()).toEqual(expected.getTimezoneOffset() / -60);
        });

        it('should correctly convert date just after spring-forward (US)', () => {
            // 2015-03-08 07:00 UTC = moment US/Eastern springs forward
            dateTime = DateTime.fromString('2015-03-08T08:30:00Z');
            let expected = new Date(Date.UTC(2015, 2, 8, 8, 30, 0));
            expect(dateTime.getHours()).toEqual(expected.getHours());
            expect(dateTime.getMinutes()).toEqual(expected.getMinutes());
            expect(dateTime.getTimezone().getOffset()).toEqual(expected.getTimezoneOffset() / -60);
        });

        it('should correctly convert date just after fall-back (US)', () => {
            // 2015-11-01 06:00 UTC = moment US/Eastern falls back
            dateTime = DateTime.fromString('2015-11-01T06:30:00Z');
            let expected = new Date(Date.UTC(2015, 10, 1, 6, 30, 0));
            expect(dateTime.getHours()).toEqual(expected.getHours());
            expect(dateTime.getMinutes()).toEqual(expected.getMinutes());
            expect(dateTime.getTimezone().getOffset()).toEqual(expected.getTimezoneOffset() / -60);
        });

        it('should use correct timezone offset for winter vs summer dates', () => {
            let winterDt = DateTime.fromString('2015-01-15T12:00:00Z');
            let summerDt = DateTime.fromString('2015-07-15T12:00:00Z');
            let winterRef = new Date(Date.UTC(2015, 0, 15, 12, 0, 0));
            let summerRef = new Date(Date.UTC(2015, 6, 15, 12, 0, 0));

            // Timezone offsets should match JS Date behavior for each season
            expect(winterDt.getTimezone().getOffset()).toEqual(winterRef.getTimezoneOffset() / -60);
            expect(summerDt.getTimezone().getOffset()).toEqual(summerRef.getTimezoneOffset() / -60);

            // If the local timezone observes DST, offsets will differ between winter and summer
            let winterOffset = winterRef.getTimezoneOffset();
            let summerOffset = summerRef.getTimezoneOffset();
            if (winterOffset !== summerOffset) {
                expect(winterDt.getTimezone().getOffset()).not.toEqual(summerDt.getTimezone().getOffset());
            }
        });

        it('should handle midnight UTC crossing date boundary', () => {
            // 2015-07-15T23:30:00Z — in positive-offset timezones this crosses to the next day
            dateTime = DateTime.fromString('2015-07-15T23:30:00Z');
            let expected = new Date(Date.UTC(2015, 6, 15, 23, 30, 0));
            expect(dateTime.getYear()).toEqual(expected.getFullYear());
            expect(dateTime.getMonth()).toEqual(expected.getMonth());
            expect(dateTime.getDay()).toEqual(expected.getDate());
            expect(dateTime.getHours()).toEqual(expected.getHours());
            expect(dateTime.getMinutes()).toEqual(expected.getMinutes());
        });
    });
});
