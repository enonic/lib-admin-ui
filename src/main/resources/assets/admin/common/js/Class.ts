export class Class {

    private name: string;

    private fn: new <T>(...args: unknown[]) => T;

    constructor(name: string, fn: new (...args: unknown[]) => any) {
        this.name = name;
        this.fn = fn;
    }

    getName(): string {
        return this.name;
    }

    newInstance<T>(constructorParams?: unknown): T {
        try {
            return new this.fn(constructorParams);
        } catch (e) {
            const newInstance = Object.create(this.fn.prototype);
            newInstance.constructor.call(newInstance, constructorParams);
            return newInstance;
        }
    }
}
