import type {ReactNode} from 'react';
import {createContext, useContext} from 'react';

const LocaleContext = createContext<string | undefined>(undefined);

export type LocaleProviderProps = {
    locale: string | undefined;
    children?: ReactNode;
};

const LOCALE_PROVIDER_NAME = 'LocaleProvider';

export const LocaleProvider = ({locale, children}: LocaleProviderProps): ReactNode => {
    return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
};

LocaleProvider.displayName = LOCALE_PROVIDER_NAME;

export const useLocale = (): string | undefined => useContext(LocaleContext);
