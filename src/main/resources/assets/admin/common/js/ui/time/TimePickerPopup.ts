import {Timezone} from '../../util/Timezone';
import {DateHelper} from '../../util/DateHelper';
import {UlEl} from '../../dom/UlEl';
import {AEl} from '../../dom/AEl';
import {SpanEl} from '../../dom/SpanEl';
import {LiEl} from '../../dom/LiEl';
import {Body} from '../../dom/Body';
import {TimeHM} from '../../util/TimeHM';
import * as Q from 'q';

export class TimePickerPopupBuilder {

    hours: number;

    minutes: number;

    useLocalTimezone: boolean = false;

    defaultTime: TimeHM;

    setHours(value: number): TimePickerPopupBuilder {
        this.hours = value;
        return this;
    }

    getHours(): number {
        return this.hours;
    }

    setMinutes(value: number): TimePickerPopupBuilder {
        this.minutes = value;
        return this;
    }

    getMinutes(): number {
        return this.minutes;
    }

    setUseLocalTimezone(value: boolean): TimePickerPopupBuilder {
        this.useLocalTimezone = value;
        return this;
    }

    isUseLocalTimezone(): boolean {
        return this.useLocalTimezone;
    }

    setDefaultTime(value: TimeHM): TimePickerPopupBuilder {
        this.defaultTime = value;
        return this;
    }

    getDefaultTime(): TimeHM {
        return this.defaultTime;
    }

    build(): TimePickerPopup {
        return new TimePickerPopup(this);
    }

}

export class TimePickerPopup
    extends UlEl {

    private nextHour: AEl;
    private hour: SpanEl;
    private prevHour: AEl;
    private nextMinute: AEl;
    private minute: SpanEl;
    private prevMinute: AEl;

    private timezoneOffset?: SpanEl;
    private timezoneLocation?: SpanEl;

    private selectedHour: number;
    private selectedMinute: number;
    private interval: number;

    private useLocalTimezone: boolean = false;

    private timeChangedListeners: ((time: TimeHM) => void)[] = [];
    private builder: TimePickerPopupBuilder;

    constructor(builder: TimePickerPopupBuilder) {
        super('time-picker-dialog');

        this.builder = builder;
        this.initElements();
        this.initListeners();
    }

    protected initElements(): void {
        this.nextHour = new AEl('next');
        this.hour = new SpanEl();
        this.prevHour = new AEl('prev');
        this.nextMinute = new AEl('next');
        this.minute = new SpanEl();
        this.prevMinute = new AEl('prev');

        this.useLocalTimezone = this.builder.isUseLocalTimezone();

        if (this.useLocalTimezone) {
            this.timezoneLocation = new SpanEl('timezone-location');
            this.timezoneOffset = new SpanEl('timezone-offset'); // .setHtml(this.getUTCString(this.timezone.getOffset()))
        }

        this.presetTime();
    }

    presetTime() {
        this.selectedHour = this.getDefaultHours(this.builder);
        this.selectedMinute = this.getDefaultMinutes(this.builder);
        this.hour.setHtml(DateHelper.padNumber(this.selectedHour));
        this.minute.setHtml(DateHelper.padNumber(this.selectedMinute));
    }

    protected initListeners(): void {
        this.nextHour.onMouseDown(() => {
            this.addHour(+1);
            this.startInterval(this.addHour, 1);
        });

        this.nextHour.onClicked((e: MouseEvent) => {
            e.stopPropagation();
            e.preventDefault();
            return false;
        });

        Body.get().onMouseUp(() => {
            this.stopInterval();
        });

        this.prevHour.onMouseDown(() => {
            this.addHour(-1);
            this.startInterval(this.addHour, -1);
        });

        this.prevHour.onClicked((e: MouseEvent) => {
            e.stopPropagation();
            e.preventDefault();
            return false;
        });

        this.nextMinute.onMouseDown(() => {
            this.addMinute(+1);
            this.startInterval(this.addMinute, 1);
        });

        this.nextMinute.onClicked((e: MouseEvent) => {
            e.stopPropagation();
            e.preventDefault();
            return false;
        });

        this.prevMinute.onMouseDown(() => {
            this.addMinute(-1);
            this.startInterval(this.addMinute, -1);
        });

        this.prevMinute.onClicked((e: MouseEvent) => {
            e.stopPropagation();
            e.preventDefault();
            return false;
        });
    }

    getSelectedTime(): TimeHM {
        return this.selectedHour != null && this.selectedMinute != null ? new TimeHM(this.selectedHour, this.selectedMinute) : null;
    }

    onSelectedTimeChanged(listener: (time: TimeHM) => void): void {
        this.timeChangedListeners.push(listener);
    }

    unSelectedTimeChanged(listener: (time: TimeHM) => void): void {
        this.timeChangedListeners = this.timeChangedListeners.filter((curr: (time: TimeHM) => void) => {
            return curr !== listener;
        });
    }

    setSelectedTime(time: TimeHM, silent?: boolean): void {
        if (time && DateHelper.isHoursValid(time.hours) && DateHelper.isMinutesValid(time.minutes)) {
            this.selectedHour = time.hours;
            this.selectedMinute = time.minutes;
        } else {
            this.selectedHour = null;
            this.selectedMinute = null;
        }

        this.hour.setHtml(DateHelper.padNumber(this.selectedHour || 0));
        this.minute.setHtml(DateHelper.padNumber(this.selectedMinute || 0));

        if (!silent) {
            this.notifyTimeChanged(new TimeHM(this.selectedHour, this.selectedMinute));
        }
    }

    updateLocalTimezoneByDate(date: Date): void {
        if (this.useLocalTimezone) {
            const timezone = Timezone.getDateTimezone(date);
            this.timezoneOffset.setHtml(this.getUTCString(timezone.getOffset()));
        }
    }

    private startInterval(fn: (add: number, silent?: boolean) => void, ...args: any[]) {
        let times: number = 0;
        let delay: number = 400;

        const intervalFn: () => void = () => {
            fn.apply(this, args);
            if (++times % 5 === 0 && delay > 50) {
                // speed up after 5 occurrences but not faster than 50ms
                this.stopInterval();
                delay /= 2;
                this.interval = setInterval(intervalFn, delay);
            }
        };
        this.interval = setInterval(intervalFn, delay);
    }

    private stopInterval() {
        clearInterval(this.interval);
    }

    private getUTCString(value: number) {
        if (!value && value !== 0) {
            return '';
        }

        let result: string = 'UTC';
        result = value > 0 ? result + '+' : (value === 0 ? result + '-' : result);
        return result + value;
    }

    private addHour(add: number, silent?: boolean) {
        this.selectedHour += add;

        if (this.selectedHour < 0) {
            this.selectedHour += 24;
        } else if (this.selectedHour > 23) {
            this.selectedHour -= 24;
        }

        this.setSelectedTime(new TimeHM(this.selectedHour, this.selectedMinute || 0), silent);
    }

    private addMinute(add: number, silent?: boolean) {
        this.selectedMinute += add;

        if (this.selectedMinute < 0) {
            this.selectedMinute += 60;
            this.addHour(-1, true);
        } else if (this.selectedMinute > 59) {
            this.selectedMinute -= 60;
            this.addHour(1, true);
        }

        this.setSelectedTime(new TimeHM(this.selectedHour || 0, this.selectedMinute), silent);
    }

    private notifyTimeChanged(time: TimeHM) {
        this.timeChangedListeners.forEach((listener: (time: TimeHM) => void) => {
            listener(time);
        });
    }

    private getDefaultHours(builder: TimePickerPopupBuilder): number {
        const hours = builder.getHours() || builder.getDefaultTime()?.hours || 0;
        return DateHelper.isHoursValid(hours) ? hours : null;
    }

    private getDefaultMinutes(builder: TimePickerPopupBuilder): number {
        const minutes = builder.getMinutes() || builder.getDefaultTime()?.minutes || 0;
        return DateHelper.isMinutesValid(minutes) ? minutes : null;
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            const hourContainer: LiEl = new LiEl();
            this.appendChild(hourContainer);

            this.prevHour.appendChild(new SpanEl());
            this.nextHour.appendChild(new SpanEl());

            hourContainer.appendChildren(this.nextHour, this.hour, this.prevHour);

            const minuteContainer: LiEl = new LiEl();
            this.appendChild(minuteContainer);

            this.prevMinute.appendChild(new SpanEl());
            this.nextMinute.appendChild(new SpanEl());

            minuteContainer.appendChildren(this.nextMinute, this.minute, this.prevMinute);

            if (this.useLocalTimezone) {
                const timezoneContainer: LiEl = new LiEl('timezone');
                timezoneContainer.appendChild(this.timezoneLocation);
                timezoneContainer.appendChild(this.timezoneOffset);
                this.appendChild(timezoneContainer);
            }
            return rendered;
        });
    }
}
