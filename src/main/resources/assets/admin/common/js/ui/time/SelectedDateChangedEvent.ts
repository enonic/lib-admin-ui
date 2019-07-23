module api.ui.time {

    export class SelectedDateChangedEvent {

        private date: Date;

        private userInput: boolean;

        constructor(selectedDate: Date, userInput?: boolean) {
            this.date = selectedDate;
            this.userInput = userInput;
        }

        getDate(): Date {
            return this.date;
        }

        isUserInput(): boolean {
            return this.userInput;
        }
    }

}
