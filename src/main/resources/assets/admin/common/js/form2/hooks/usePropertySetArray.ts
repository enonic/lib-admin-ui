import {useEffect, useState} from 'react';

import type {PropertyArray} from '../../data/PropertyArray';
import type {PropertySet} from '../../data/PropertySet';

export type UsePropertySetArrayResult = {
    propertySets: PropertySet[];
    size: number;
};

function readPropertySets(propertyArray: PropertyArray): PropertySet[] {
    return propertyArray
        .getProperties()
        .map(p => p.getPropertySet())
        .filter((ps): ps is PropertySet => ps != null);
}

const EMPTY: UsePropertySetArrayResult = {propertySets: [], size: 0};

export function usePropertySetArray(propertyArray: PropertyArray | null): UsePropertySetArrayResult {
    const [result, setResult] = useState<UsePropertySetArrayResult>(() => {
        if (propertyArray == null) return EMPTY;
        const propertySets = readPropertySets(propertyArray);
        return {propertySets, size: propertySets.length};
    });

    useEffect(() => {
        if (propertyArray == null) {
            setResult(EMPTY);
            return undefined;
        }

        // Sync state in case propertyArray identity changed
        const propertySets = readPropertySets(propertyArray);
        setResult({propertySets, size: propertySets.length});

        const handler = () => {
            const updated = readPropertySets(propertyArray);
            setResult({propertySets: updated, size: updated.length});
        };

        // Only structural events — skip onPropertyValueChanged intentionally.
        // Nested content changes are handled by each occurrence's own hooks.
        propertyArray.onPropertyAdded(handler);
        propertyArray.onPropertyRemoved(handler);
        propertyArray.onPropertyMoved(handler);

        return () => {
            propertyArray.unPropertyAdded(handler);
            propertyArray.unPropertyRemoved(handler);
            propertyArray.unPropertyMoved(handler);
        };
    }, [propertyArray]);

    return result;
}
