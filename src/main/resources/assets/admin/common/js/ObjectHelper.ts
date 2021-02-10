import {NumberHelper} from './util/NumberHelper';
import {Equitable} from './Equitable';
import {ClassHelper} from './ClassHelper';

export class ObjectHelper {

    /**
     * Method to create an object of given class (useful when TS won't allow it, i.e new Event())
     * @param constructor class to use for new object
     * @param args arguments constructor arguments
     * @returns {Object}
     */
    static create(constructor: Function, ..._args: any[]) {
        let factory = constructor.bind.apply(constructor, arguments);
        return new factory();
    }

    static iFrameSafeInstanceOf(obj: any, fn: Function): boolean {
        if (!fn) {
            console.warn('Undefined fn passed to iFrameSafeInstanceOf, returning false', obj, fn);
            return false;
        }
        if (!obj) {
            return false;
        }

        if (obj instanceof fn) {
            return true;
        }

        if (ClassHelper.getClassName(obj) === ClassHelper.getFunctionName(fn)) {
            return true;
        }

        if (!(typeof obj === 'object')) {
            return false;
        }

        let prototype = Object.getPrototypeOf(obj);

        do {
            prototype = Object.getPrototypeOf(prototype);
            if (!prototype) {
                return false;
            }
        }
        while (ClassHelper.getClassName(prototype) !== ClassHelper.getFunctionName(fn));

        return true;
    }

    static baseEquals(a: any, b: any): boolean {
        if (!a && !b) {
            return true;
        } else if (!a || !b) {
            return false;
        }

        return undefined;
    }

    static equals(a: Equitable, b: Equitable): boolean {
        const result = ObjectHelper.baseEquals(a, b);
        if (typeof result === 'boolean') {
            return result;
        }

        return a.equals(b);
    }

    static arrayEquals(arrayA: Equitable[], arrayB: Equitable[]): boolean {
        return ObjectHelper.arrayEquals(arrayA, arrayB);
    }

    static anyArrayEquals(arrayA: any[], arrayB: any[]) {
        const result = ObjectHelper.baseEquals(arrayA, arrayB);
        if (typeof result === 'boolean') {
            return result;
        }

        if (arrayA.length !== arrayB.length) {
            return false;
        }

        for (let i = 0; i < arrayA.length; i++) {
            if (!ObjectHelper.objectEquals(arrayA[i], arrayB[i])) {
                return false;
            }
        }

        return true;
    }

    static objectMapEquals(mapA: { [s: string]: Equitable; }, mapB: { [s: string]: Equitable; }) {
        const result = ObjectHelper.baseEquals(mapA, mapB);
        if (typeof result === 'boolean') {
            return result;
        }

        // Gather keys for both maps
        const keysA: string[] = [];
        for (const keyA  in mapA) {
            if (mapA.hasOwnProperty(keyA)) {
                keysA.push(keyA);
            }
        }
        const keysB: string[] = [];
        for (const keyB  in mapB) {
            if (mapB.hasOwnProperty(keyB)) {
                keysB.push(keyB);
            }
        }

        if (!ObjectHelper.stringArrayEquals(keysA.sort(), keysB.sort())) {
            return false;
        }

        return keysA.every((curKeyA: string) => {
            const valueA: Equitable = mapA[curKeyA];
            const valueB: Equitable = mapB[curKeyA];

            return ObjectHelper.equals(valueA, valueB);
        });
    }

    static stringEquals(a: string, b: string) {
        const result = ObjectHelper.baseEquals(a, b);
        if (typeof result === 'boolean') {
            return result;
        }

        return a.toString() === b.toString();
    }

    static stringArrayEquals(arrayA: string[], arrayB: string[]) {
        const result = ObjectHelper.baseEquals(arrayA, arrayB);
        if (typeof result === 'boolean') {
            return result;
        }

        if (arrayA.length !== arrayB.length) {
            return false;
        }

        for (let i = 0; i < arrayA.length; i++) {
            if (!ObjectHelper.stringEquals(arrayA[i], arrayB[i])) {
                return false;
            }
        }

        return true;
    }

    static booleanEquals(a: boolean, b: boolean) {
        const result = ObjectHelper.baseEquals(a, b);
        if (typeof result === 'boolean') {
            return result;
        }

        return a === b;
    }

    /*
     * Keep in mind that !0 is true as well as !null
     */
    static numberEquals(a: number, b: number) {
        return NumberHelper.isNumber(a) && NumberHelper.isNumber(b) && a === b;
    }

    static dateEquals(a: Date, b: Date) {
        const result = ObjectHelper.baseEquals(a, b);
        if (typeof result === 'boolean') {
            return result;
        }

        return a.toISOString() === b.toISOString();
    }

    static dateEqualsUpToMinutes(a: Date, b: Date) {
        const result = ObjectHelper.baseEquals(a, b);
        if (typeof result === 'boolean') {
            return result;
        }

        const clonedA = new Date(a.getTime());
        a.setSeconds(0, 0);
        const clonedB = new Date(b.getTime());
        b.setSeconds(0, 0);

        return clonedA.toISOString() === clonedB.toISOString();
    }

    static anyEquals(a: any, b: any) {
        const result = ObjectHelper.baseEquals(a, b);
        if (typeof result === 'boolean') {
            return result;
        }

        return JSON.stringify(a) === JSON.stringify(b);
    }

    static objectEquals(a: Object, b: Object) {
        const result = ObjectHelper.baseEquals(a, b);
        if (typeof result === 'boolean') {
            return result;
        }

        if (a === b) {
            return true;
        }

        if (ClassHelper.getClassName(a) !== ClassHelper.getClassName(b)) {
            return false;
        }

        /*
         To avoid exception, when converting circular structure to JSON in Chrome the replacer
         function must be used to replace references to the same object with `undefined`.
         */
        let aString = JSON.stringify(a, (key, value) => {
            return (!!key && a === value) ? undefined : value;
        });
        let bString = JSON.stringify(b, (key, value) => {
            return (!!key && b === value) ? undefined : value;
        });
        return aString === bString;

    }

    static objectPropertyIterator(object: any, callback: { (name: string, property: any, index?: number): void; }) {

        let index = 0;
        for (let name  in object) {
            if (object.hasOwnProperty(name)) {
                let property = object[name];
                callback(name, property, index++);
            }
        }
    }

    static propertyExists(object: Object, key: string) {
        return !!object && object.hasOwnProperty(key) && !!object[key];
    }
}
