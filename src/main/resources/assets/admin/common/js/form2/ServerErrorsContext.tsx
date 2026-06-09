import type {ReactNode} from 'react';
import {createContext, useContext, useMemo} from 'react';

export type ServerErrorEntry = {
    path: string;
    message: string;
};

export type ServerErrorsValue = {
    entries: readonly ServerErrorEntry[];
    clear: (occurrencePath: string) => void;
    clearField: (fieldPath: string) => void;
};

export type ServerErrorsProviderProps = ServerErrorsValue & {
    children?: ReactNode;
};

const SERVER_ERRORS_PROVIDER_NAME = 'ServerErrorsProvider';

const ServerErrorsContext = createContext<ServerErrorsValue | undefined>(undefined);

export const ServerErrorsProvider = ({entries, clear, clearField, children}: ServerErrorsProviderProps): ReactNode => {
    const value = useMemo<ServerErrorsValue>(() => ({entries, clear, clearField}), [entries, clear, clearField]);
    return <ServerErrorsContext.Provider value={value}>{children}</ServerErrorsContext.Provider>;
};

ServerErrorsProvider.displayName = SERVER_ERRORS_PROVIDER_NAME;

export const useServerErrors = (): ServerErrorsValue | undefined => {
    return useContext(ServerErrorsContext);
};
