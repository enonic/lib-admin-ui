import {i18n} from '../../util/Messages';
import {DivEl} from '../../dom/DivEl';
import {DateHelper} from '../../util/DateHelper';
import {SpanEl} from '../../dom/SpanEl';
import {DayOfWeek} from './DayOfWeek';
import {DaysOfWeek} from './DaysOfWeek';
import {CalendarDay, CalendarDayBuilder} from './CalendarDay';
import {SelectedDateChangedEvent} from './SelectedDateChangedEvent';
import {CalendarWeek, CalendarWeekBuilder} from './CalendarWeek';
import {CalendarDayClickedEvent} from './CalendarDayClickedEvent';

export class CalendarBuilder {

    year: number;

    month: number;

    selectedDate: Date;

    startingDayOfWeek: DayOfWeek;

    interactive: boolean = true;

    setYear(value: number): CalendarBuilder {
        this.year = value;
        return this;
    }

    setMonth(value: number): CalendarBuilder {
        this.month = value;
        return this;
    }

    setSelectedDate(value: Date): CalendarBuilder {
        this.selectedDate = value;
        return this;
    }

    setStartingDayOfWeek(value: DayOfWeek): CalendarBuilder {
        this.startingDayOfWeek = value;
        return this;
    }

    setInteractive(value: boolean): CalendarBuilder {
        this.interactive = value;
        return this;
    }

    build(): Calendar {
        return new Calendar(this);
    }
}

export class Calendar
    extends DivEl {

    private interactive: boolean;

    private year: number;

    private month: number;

    private selectedDate: Date;

    private calendarDays: CalendarDay[];

    private startingDayOfWeek: DayOfWeek;

    private weeks: CalendarWeek [];

    private selectedDateChangedListeners: { (event: SelectedDateChangedEvent): void }[] = [];

    private shownMonthChangedListeners: { (month: number, year: number): void }[] = [];

    constructor(builder: CalendarBuilder) {
        super('calendar');

        let now = new Date();
        this.year = builder.selectedDate ? builder.selectedDate.getFullYear() : builder.year || now.getFullYear();
        this.month = builder.selectedDate ? builder.selectedDate.getMonth() : builder.month || now.getMonth();
        this.selectedDate = builder.selectedDate;
        this.startingDayOfWeek = builder.startingDayOfWeek || DaysOfWeek.MONDAY;
        this.interactive = builder.interactive;

        this.renderMonth();
    }

    public selectDate(value: Date, silent?: boolean) {
        if (value) {
            this.year = value.getFullYear();
            this.month = value.getMonth();
            this.selectedDate = value;
            this.removeChildren();

            if (DateHelper.isInvalidDate(value)) {
                let spanEl = new SpanEl().setHtml(i18n('field.invaliddate'));
                this.appendChild(spanEl);
            } else {
                this.renderMonth();
            }
        } else {
            this.selectedDate = null;
            let now = new Date();
            this.year = now.getFullYear();
            this.month = now.getMonth();
        }

        if (!silent) {
            this.notifySelectedDateChanged(value);
        }
    }

    public nextMonth() {
        this.month++;
        if (this.month > 11) {
            this.month = 0;
            this.year++;
        }
        this.removeChildren();
        this.renderMonth();
    }

    public previousMonth() {
        this.month--;
        if (this.month < 0) {
            this.month = 11;
            this.year--;
        }
        this.removeChildren();
        this.renderMonth();
    }

    public nextYear() {
        this.year++;
        this.removeChildren();
        this.renderMonth();
    }

    public previousYear() {
        this.year--;
        this.removeChildren();
        this.renderMonth();
    }

    public getSelectedDate(): Date {
        return this.selectedDate;
    }

    public getMonth(): number {
        return this.month;
    }

    public getYear(): number {
        return this.year;
    }

    public getCalendarDays(): CalendarDay [] {
        return this.calendarDays;
    }

    onSelectedDateChanged(listener: (event: SelectedDateChangedEvent) => void) {
        this.selectedDateChangedListeners.push(listener);
    }

    unSelectedDateChanged(listener: (event: SelectedDateChangedEvent) => void) {
        this.selectedDateChangedListeners = this.selectedDateChangedListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    onShownMonthChanged(listener: (month: number, year: number) => void) {
        this.shownMonthChangedListeners.push(listener);
    }

    unShownMonthChanged(listener: (month: number, year: number) => void) {
        this.shownMonthChangedListeners = this.shownMonthChangedListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    private renderMonth() {
        this.calendarDays = this.resolveDaysInMonth();
        let firstDay = this.resolveFirstDayOfCalendar();
        this.weeks = this.createCalendarWeeks(firstDay);
        this.weeks.forEach((week) => {
            this.appendChild(week);
        });
        this.notifyShownMonthChanged(this.month, this.year);
    }

    private resolveDaysInMonth() {
        let calendarDays: CalendarDay[] = [];
        let daysInMonth = DateHelper.numDaysInMonth(this.year, this.month);
        let previousDay: CalendarDay = null;
        for (let i = 1; i <= daysInMonth; i++) {
            let calendarDay = this.createCalendarDay(i, previousDay);
            calendarDays.push(calendarDay);
            previousDay = calendarDay;
        }
        return calendarDays;
    }

    private resolveFirstDayOfCalendar() {
        let firstDay: CalendarDay = null;
        if (this.startingDayOfWeek.equals(this.calendarDays[0].getDayOfWeek())) {
            firstDay = this.calendarDays[0];
        } else {
            let previousDay = this.calendarDays[0].getPrevious();
            while (!previousDay.getDayOfWeek().equals(this.startingDayOfWeek)) {
                previousDay = previousDay.getPrevious();
            }
            firstDay = previousDay;
        }
        return firstDay;
    }

    private createCalendarWeeks(firstDay: CalendarDay) {
        let weeks: CalendarWeek [] = [];
        let currWeek = this.createCalendarWeek(firstDay);
        weeks.push(currWeek);
        while (!currWeek.hasLastDayOfMonth(this.month)) {
            let newWeek = this.createCalendarWeek(currWeek.getNextWeeksFirstDay());
            weeks.push(newWeek);
            currWeek = newWeek;
        }
        return weeks;
    }

    private createCalendarWeek(firstDayOfWeek: CalendarDay): CalendarWeek {
        let weekBuilder = new CalendarWeekBuilder();
        weekBuilder.addDay(firstDayOfWeek);
        let nextDay = firstDayOfWeek.getNext();
        for (let i = 0; i < 6; i++) {
            weekBuilder.addDay(nextDay);
            nextDay = nextDay.getNext();
        }
        return weekBuilder.build();
    }

    private createCalendarDay(dayOfMonth: number, previousDay: CalendarDay): CalendarDay {

        let date = new Date(this.year, this.month, dayOfMonth);
        let calendarDay = new CalendarDayBuilder().setDate(date).setMonth(this.month).setPreviousDay(previousDay).build();
        if (calendarDay.isInMonth()) {

            if (this.interactive) {
                calendarDay.onCalendarDayClicked((event: CalendarDayClickedEvent) => this.handleCalendarDayClicked(event));
            }

            if (this.selectedDate && this.selectedDate.toDateString() === date.toDateString()) {
                calendarDay.setSelectedDay(true);
            }
        }
        return calendarDay;
    }

    private handleCalendarDayClicked(event: CalendarDayClickedEvent) {

        this.calendarDays.forEach((calendarDay: CalendarDay) => {
            calendarDay.setSelectedDay(event.getCalendarDay().equals(calendarDay));
        });

        this.selectedDate = event.getCalendarDay().getDate();
        this.notifySelectedDateChanged(this.selectedDate);
    }

    private notifySelectedDateChanged(date: Date) {
        let event = new SelectedDateChangedEvent(date);
        this.selectedDateChangedListeners.forEach((listener) => {
            listener(event);
        });
    }

    private notifyShownMonthChanged(month: number, year: number) {
        this.shownMonthChangedListeners.forEach((listener) => {
            listener(month, year);
        });
    }
}
