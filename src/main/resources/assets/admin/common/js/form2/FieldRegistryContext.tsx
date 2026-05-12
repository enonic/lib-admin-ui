import type {ReactNode} from 'react';
import {createContext, useContext, useMemo} from 'react';
import {FieldRegistry} from './FieldRegistry';

export type FieldRegistryProviderProps = {
    /**
     * Caller-supplied registry instance. Provide one when external code outside the
     * React tree (event handlers, async callbacks) needs a stable reference. When
     * omitted, a fresh registry is created per provider.
     */
    registry?: FieldRegistry;
    children?: ReactNode;
};

const FIELD_REGISTRY_PROVIDER_NAME = 'FieldRegistryProvider';

const FieldRegistryContext = createContext<FieldRegistry | undefined>(undefined);

export const FieldRegistryProvider = ({registry, children}: FieldRegistryProviderProps): ReactNode => {
    const value = useMemo(() => registry ?? new FieldRegistry(), [registry]);
    return <FieldRegistryContext.Provider value={value}>{children}</FieldRegistryContext.Provider>;
};

FieldRegistryProvider.displayName = FIELD_REGISTRY_PROVIDER_NAME;

/** Read the shared field registry. Returns `undefined` when no provider is present. */
export const useFieldRegistry = (): FieldRegistry | undefined => {
    return useContext(FieldRegistryContext);
};
