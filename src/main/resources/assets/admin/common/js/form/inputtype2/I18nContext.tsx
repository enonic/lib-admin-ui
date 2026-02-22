import type {ReactNode} from 'react';
import {createContext, useContext} from 'react';
import {i18n} from '../../util/Messages';

type I18nFn = (key: string, ...args: unknown[]) => string;

const I18nContext = createContext<I18nFn>(i18n as I18nFn);

type I18nProviderProps = {
    messages: Record<string, string>;
    children?: ReactNode;
};

const I18N_PROVIDER_NAME = 'I18nProvider';

export const I18nProvider = ({messages, children}: I18nProviderProps): ReactNode => {
    const translate: I18nFn = (key, ...args) => {
        const value = messages[key];
        if (value == null) return `#${key}#`;
        return value.replace(/{(\d+)}/g, (_, i: string) => String(args[Number(i)] ?? '')).trim();
    };
    return <I18nContext.Provider value={translate}>{children}</I18nContext.Provider>;
};

I18nProvider.displayName = I18N_PROVIDER_NAME;

export const useI18n = (): I18nFn => {
    return useContext(I18nContext);
};
