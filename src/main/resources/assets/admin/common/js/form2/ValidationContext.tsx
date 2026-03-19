import type {ReactNode} from 'react';
import {createContext, useContext} from 'react';

/**
 * Controls which validation errors are shown to the user.
 *
 * - `'none'`        — suppress all errors (e.g. before first interaction)
 * - `'interactive'` — show errors only for touched fields
 * - `'all'`         — show all errors unconditionally (default)
 */
export type ValidationVisibility = 'none' | 'interactive' | 'all';

export type ValidationVisibilityProviderProps = {
    visibility: ValidationVisibility;
    children?: ReactNode;
};

const VALIDATION_VISIBILITY_PROVIDER_NAME = 'ValidationVisibilityProvider';

const ValidationVisibilityContext = createContext<ValidationVisibility>('all');

export const ValidationVisibilityProvider = ({visibility, children}: ValidationVisibilityProviderProps): ReactNode => {
    return <ValidationVisibilityContext.Provider value={visibility}>{children}</ValidationVisibilityContext.Provider>;
};

ValidationVisibilityProvider.displayName = VALIDATION_VISIBILITY_PROVIDER_NAME;

/** Read the current validation visibility mode. Defaults to `'all'` without a provider. */
export const useValidationVisibility = (): ValidationVisibility => {
    return useContext(ValidationVisibilityContext);
};
