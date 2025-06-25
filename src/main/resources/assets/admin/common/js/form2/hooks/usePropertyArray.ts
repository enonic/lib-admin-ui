import {useEffect, useState} from 'react';

import type {PropertyArray} from '../../data/PropertyArray';
import type {Value} from '../../data/Value';

export type UsePropertyArrayResult = {
    values: Value[];
    size: number;
};

function readValues(propertyArray: PropertyArray): Value[] {
    return propertyArray.getProperties().map(p => p.getValue());
}

const EMPTY: UsePropertyArrayResult = {values: [], size: 0};

export function usePropertyArray(propertyArray: PropertyArray | null): UsePropertyArrayResult {
    const [result, setResult] = useState<UsePropertyArrayResult>(() => {
        if (propertyArray == null) return EMPTY;
        return {values: readValues(propertyArray), size: propertyArray.getSize()};
    });

    useEffect(() => {
        if (propertyArray == null) {
            setResult(EMPTY);
            return undefined;
        }

        // Sync state in case propertyArray identity changed
        setResult({values: readValues(propertyArray), size: propertyArray.getSize()});

        const handler = () => {
            setResult({values: readValues(propertyArray), size: propertyArray.getSize()});
        };

        propertyArray.onPropertyAdded(handler);
        propertyArray.onPropertyRemoved(handler);
        propertyArray.onPropertyValueChanged(handler);
        propertyArray.onPropertyMoved(handler);

        return () => {
            propertyArray.unPropertyAdded(handler);
            propertyArray.unPropertyRemoved(handler);
            propertyArray.unPropertyValueChanged(handler);
            propertyArray.unPropertyMoved(handler);
        };
    }, [propertyArray]);

    return result;
}
