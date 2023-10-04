export class Class {
    private readonly name: string;
    private readonly fn: new (...args: any[]) => any;

    constructor(name: string, fn: new (...args: any[]) => any) {
        this.name = name;
        this.fn = fn;
    }

    getName(): string {
        return this.name;
    }

    newInstance(constructorParams?: any): any {
        return new this.fn(constructorParams);
    }
}
