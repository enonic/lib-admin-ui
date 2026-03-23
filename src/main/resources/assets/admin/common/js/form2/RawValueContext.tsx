import type {ReactNode} from 'react';
import {createContext, useContext} from 'react';
import type {RawValueMap} from './descriptor/validateForm';

export type RawValueProviderProps = {
    map: RawValueMap;
    children?: ReactNode;
};

const RAW_VALUE_PROVIDER_NAME = 'RawValueProvider';

const RawValueContext = createContext<RawValueMap | undefined>(undefined);

export const RawValueProvider = ({map, children}: RawValueProviderProps): ReactNode => {
    return <RawValueContext.Provider value={map}>{children}</RawValueContext.Provider>;
};

RawValueProvider.displayName = RAW_VALUE_PROVIDER_NAME;

/** Read the shared raw-value map. Returns `undefined` when no provider is present. */
export const useRawValueMap = (): RawValueMap | undefined => {
    return useContext(RawValueContext);
};
