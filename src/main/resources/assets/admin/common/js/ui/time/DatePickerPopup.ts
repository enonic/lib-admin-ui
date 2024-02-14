import {DivEl} from '../../dom/DivEl';
import {AEl} from '../../dom/AEl';
import {SpanEl} from '../../dom/SpanEl';
import {H2El} from '../../dom/H2El';
import {H5El} from '../../dom/H5El';
import {Calendar, CalendarBuilder} from './Calendar';
import {SelectedDateChangedEvent} from './SelectedDateChangedEvent';
import {MonthsOfYear} from './MonthsOfYear';
import * as Q from 'q';

export class DatePickerPopupBuilder {

    date: Date;

    setDate(date: Date): DatePickerPopupBuilder {
        this.date = date;
        return this;
    }

    build(): DatePickerPopup {
        return new DatePickerPopup(this);
    }

}

export class DatePickerPopup
    extends DivEl {

    private prevYear: AEl;
    private year: SpanEl;
    private nextYear: AEl;
    private prevMonth: AEl;
    private month: SpanEl;
    private nextMonth: AEl;
    private calendar: Calendar;

    constructor(builder: DatePickerPopupBuilder) {
        super('date-picker-dialog');

        this.initElements(builder);
        this.initListeners();
    }

    protected initElements(builder: DatePickerPopupBuilder): void {
        this.prevYear = new AEl('prev');
        this.year = new SpanEl();
        this.nextYear = new AEl('next');
        this.prevMonth = new AEl('prev');
        this.month = new SpanEl();
        this.nextMonth = new AEl('next');

        this.calendar = new CalendarBuilder().setSelectedDate(builder.date).build();
        this.year.setHtml(this.calendar.getYear().toString());
        this.month.setHtml(MonthsOfYear.getByNumberCode(this.calendar.getMonth()).getFullName());
    }

    protected initListeners(): void {
        this.prevYear.onClicked((e: MouseEvent) => {
            this.calendar.previousYear();
            e.stopPropagation();
            e.preventDefault();
            return false;
        });

        this.nextYear.onClicked((e: MouseEvent) => {
            this.calendar.nextYear();
            e.stopPropagation();
            e.preventDefault();
            return false;
        });

        this.prevMonth.onClicked((e: MouseEvent) => {
            this.calendar.previousMonth();
            e.stopPropagation();
            e.preventDefault();
            return false;
        });

        this.nextMonth.onClicked((e: MouseEvent) => {
            this.calendar.nextMonth();
            e.stopPropagation();
            e.preventDefault();
            return false;
        });

        this.calendar.onShownMonthChanged((month: number, year: number) => {
            this.month.setHtml(MonthsOfYear.getByNumberCode(month).getFullName());
            this.year.setHtml(year.toString());
        });
    }

    setSelectedDate(date: Date, silent?: boolean) {
        this.calendar.selectDate(date, silent);
    }

    resetCalendar() {
        this.calendar.resetSelectedDays();
    }

    getSelectedDate(): Date {
        return this.calendar.getSelectedDate();
    }

    onSelectedDateChanged(listener: (event: SelectedDateChangedEvent) => void) {
        this.calendar.onSelectedDateChanged(listener);
    }

    unSelectedDateChanged(listener: (event: SelectedDateChangedEvent) => void) {
        this.calendar.unSelectedDateChanged(listener);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            const yearContainer: H2El = new H2El('year-container');
            this.appendChild(yearContainer);
            yearContainer.appendChild(this.prevYear);
            yearContainer.appendChild(this.year);
            yearContainer.appendChild(this.nextYear);

            const monthContainer: H5El = new H5El('month-container');
            this.appendChild(monthContainer);
            monthContainer.appendChild(this.prevMonth);
            monthContainer.appendChild(this.month);
            monthContainer.appendChild(this.nextMonth);

            this.appendChild(this.calendar);

            return rendered;
        });
    }
}

