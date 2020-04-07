export class Response {

    private data: any;

    constructor(data: any) {
        this.data = data;
    }

    isBlank(): boolean {
        return !this.data;
    }

    // tslint:disable-next-line
    hasResult(): boolean {
        return this.data != null;
    }

    getResult(): any {
        return this.data;
    }
}
