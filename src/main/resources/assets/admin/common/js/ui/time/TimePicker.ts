import {DateHelper} from '../../util/DateHelper';
import {DateTimePicker, DateTimePickerBuilder} from './DateTimePicker';
import {ObjectHelper} from '../../ObjectHelper';
import {TimeHM} from '../../util/TimeHM';

export class TimePickerBuilder
    extends DateTimePickerBuilder {

    hours: number;

    minutes: number;

    inputPlaceholder: string = 'hh:mm';

    manageDate: boolean = false;

    setHours(value: number): TimePickerBuilder {
        this.hours = value;
        return this;
    }

    setMinutes(value: number): TimePickerBuilder {
        this.minutes = value;
        return this;
    }

    build(): TimePicker {
        return new TimePicker(this);
    }
}

export class TimePicker
    extends DateTimePicker {

    constructor(builder: DateTimePickerBuilder) {
        super(builder, 'time-picker');
    }

    protected initData(): void {
        const builder: TimePickerBuilder = this.builder as TimePickerBuilder;

        if (ObjectHelper.bothDefined(builder.hours, builder.minutes)) {
            this.setTime(new TimeHM(builder.hours, builder.minutes));
        }
    }

    protected getParsedValue(value: string): TimeHM {
        return DateHelper.parseTime(value);
    }
}
