export class Class {

    private name: string;

    private fn: (...args: any[]) => void;

    constructor(name: string, fn: any) {
        this.name = name;
        this.fn = fn;
    }

    getName(): string {
        return this.name;
    }

    newInstance(constructorParams?: any): any {
        try {
            return new this.fn(constructorParams);
        } catch (e) {
            const newInstance = Object.create(this.fn.prototype);
            newInstance.constructor.call(newInstance, constructorParams);
            return newInstance;
        }
    }
}
