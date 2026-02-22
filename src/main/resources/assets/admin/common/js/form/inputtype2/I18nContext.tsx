import type {ComponentChildren} from 'preact';
import {createContext} from 'preact';
import {useContext} from 'preact/hooks';
import {i18n} from '../../util/Messages';

type I18nFn = (key: string, ...args: unknown[]) => string;

const I18nContext = createContext<I18nFn>(i18n as I18nFn);

type I18nProviderProps = {
    messages: Record<string, string>;
    children: ComponentChildren;
};

export function I18nProvider({messages, children}: I18nProviderProps) {
    const translate: I18nFn = (key, ...args) => {
        const value = messages[key];
        if (value == null) return `#${key}#`;
        return value.replace(/{(\d+)}/g, (_, i: string) => String(args[Number(i)] ?? '')).trim();
    };
    return <I18nContext.Provider value={translate}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nFn {
    return useContext(I18nContext);
}
