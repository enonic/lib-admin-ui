export class Response {

    readonly data: any;

    constructor(data: any) {
        this.data = data;
    }

    isBlank(): boolean {
        return !this.data;
    }

    hasResult(): boolean {
        return !(this.data === null || this.data === undefined);
    }

    getResult(): any {
        return this.data;
    }
}
