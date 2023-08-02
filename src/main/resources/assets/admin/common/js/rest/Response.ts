export class Response {

    readonly data: any;

    readonly status: number;

    constructor(data: any, status?: number) {
        this.data = data;
        this.status = status;
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

    getStatus(): number {
        return this.status;
    }
}
