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

    static isDefined(val: any): boolean {
        return val !== undefined && val !== null;
    }

    static bothDefined(val1: any, val2: any): boolean {
        return ObjectHelper.isDefined(val1) && ObjectHelper.isDefined(val2);
    }

    static noneDefined(val1: any, val2: any): boolean {
        return !ObjectHelper.isDefined(val1) && !ObjectHelper.isDefined(val2);
    }

    static equallyDefined(a: any, b: any): boolean {
        if (ObjectHelper.noneDefined(a, b) || ObjectHelper.bothDefined(a, b)) {
            return true;
        }

        return false;
    }

    static equals(a: Equitable, b: Equitable): boolean {
        return ObjectHelper.bothDefined(a, b) ? a.equals(b) : ObjectHelper.equallyDefined(a, b);
    }

    static arrayEquals(arrayA: Equitable[], arrayB: Equitable[]): boolean {
        return ObjectHelper.anyArrayEquals(arrayA, arrayB);
    }

    static anyArrayEquals(arrayA: any[], arrayB: any[]): boolean {
        if (ObjectHelper.bothDefined(arrayA, arrayB)) {

            if (arrayA.length !== arrayB.length) {
                return false;
            }

            for (let i = 0; i < arrayA.length; i++) {
                if (!ObjectHelper.objectEquals(arrayA[i], arrayB[i])) {
                    return false;
                }
            }
        }

        return ObjectHelper.equallyDefined(arrayA, arrayB);
    }

    static objectMapEquals(mapA: { [s: string]: Equitable; }, mapB: { [s: string]: Equitable; }): boolean {
        if (ObjectHelper.bothDefined(mapA, mapB)) {

            // Gather keys for both maps
            const keysA: string[] = [];
            for (const keyA in mapA) {
                if (mapA.hasOwnProperty(keyA)) {
                    keysA.push(keyA);
                }
            }
            const keysB: string[] = [];
            for (const keyB in mapB) {
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

        return ObjectHelper.equallyDefined(mapA, mapB);
    }

    static stringEquals(a: string, b: string): boolean {
        return ObjectHelper.bothDefined(a, b) ? a.toString() === b.toString() : ObjectHelper.equallyDefined(a, b);
    }

    static stringArrayEquals(arrayA: string[], arrayB: string[]): boolean {
        if (ObjectHelper.bothDefined(arrayA, arrayB)) {
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

        return ObjectHelper.equallyDefined(arrayA, arrayB);
    }

    static booleanEquals(a: boolean, b: boolean): boolean {
        return ObjectHelper.bothDefined(a, b) ? a === b : ObjectHelper.equallyDefined(a, b);
    }

    /*
     * Keep in mind that !0 is true as well as !null
     */
    static numberEquals(a: number, b: number): boolean {
        if (ObjectHelper.bothDefined(a, b)) {
            return NumberHelper.isNumber(a) && NumberHelper.isNumber(b) && a === b;
        }

        return NumberHelper.isNumber(a) && NumberHelper.isNumber(b) && a === b;
    }

    static dateEquals(a: Date, b: Date): boolean {
        return ObjectHelper.bothDefined(a, b) ? a.toISOString() === b.toISOString() : ObjectHelper.equallyDefined(a, b);
    }

    static dateEqualsUpToMinutes(a: Date, b: Date): boolean {
        if (ObjectHelper.bothDefined(a, b)) {

            const clonedA = new Date(a.getTime());
            a.setSeconds(0, 0);
            const clonedB = new Date(b.getTime());
            b.setSeconds(0, 0);


            return ObjectHelper.dateEquals(clonedA, clonedB);
        }

        return ObjectHelper.equallyDefined(a, b);
    }

    static anyEquals(a: any, b: any): boolean {
        return ObjectHelper.bothDefined(a, b) ? JSON.stringify(a) === JSON.stringify(b) : ObjectHelper.equallyDefined(a, b);
    }

    static objectEquals(a: Object, b: Object): boolean {
        if (ObjectHelper.bothDefined(a, b)) {

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

        return ObjectHelper.equallyDefined(a, b);
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

    static propertyExists(object: Object, key: string): boolean {
        return !!object && object.hasOwnProperty(key) && !!object[key];
    }
}
