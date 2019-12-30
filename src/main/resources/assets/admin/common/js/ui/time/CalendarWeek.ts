import {UlEl} from '../../dom/UlEl';
import {CalendarDay} from './CalendarDay';

export class CalendarWeekBuilder {

    calendarDays: CalendarDay[] = [];

    addDay(value: CalendarDay): CalendarWeekBuilder {
        this.calendarDays.push(value);
        return this;
    }

    build(): CalendarWeek {
        return new CalendarWeek(this);
    }
}

export class CalendarWeek
    extends UlEl {

    private calendarDays: CalendarDay[];

    constructor(builder: CalendarWeekBuilder) {
        super('calendar-week');

        this.calendarDays = builder.calendarDays;
        this.calendarDays.forEach((day) => {
            this.appendChild(day);
        });
    }

    hasLastDayOfMonth(month: number): boolean {
        let match = false;
        this.calendarDays.forEach((day: CalendarDay) => {
            if (day.isLastDayOfMonth(month)) {
                match = true;
            }
        });
        return match;
    }

    getNextWeeksFirstDay(): CalendarDay {
        return this.calendarDays[6].getNext();
    }

}
