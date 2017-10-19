module api.form.inputtype {

    export class ValueRemovedEvent {

        private arrayIndex: number;

        constructor(arrayIndex: number) {
            this.arrayIndex = arrayIndex;
        }

        getArrayIndex(): number {
            return this.arrayIndex;
        }
    }
}
