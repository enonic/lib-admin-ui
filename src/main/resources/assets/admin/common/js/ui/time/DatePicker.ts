import {DateHelper} from '../../util/DateHelper';
import {DateTimePicker, DateTimePickerBuilder} from './DateTimePicker';

export class DatePickerBuilder
    extends DateTimePickerBuilder {

    closeOnSelect: boolean = true;

    inputPlaceholder: string = 'YYYY-MM-DD';

    manageTime: boolean = false;

    build(): DatePicker {
        return new DatePicker(this);
    }
}

export class DatePicker
    extends DateTimePicker {

    protected getParsedValue(value: string): Date {
        return DateHelper.parseLocalDate(value);
    }
}
