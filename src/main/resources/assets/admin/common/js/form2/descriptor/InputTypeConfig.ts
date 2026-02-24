import type {PrincipalKey} from '../../security/PrincipalKey';
import type {PrincipalType} from '../../security/PrincipalType';

export type TextLineConfig = {
    regexp: RegExp | undefined;
    maxLength: number;
    showCounter: boolean;
};

export type TextAreaConfig = {
    maxLength: number;
    showCounter: boolean;
};

export type NumberConfig = {
    min: number | undefined;
    max: number | undefined;
};

export type CheckboxConfig = {
    alignment: string;
};

export type ComboBoxOptionConfig = {
    label: string;
    value: string;
};

export type ComboBoxConfig = {
    options: ComboBoxOptionConfig[];
};

export type RadioButtonOptionConfig = {
    label: string;
    value: string;
};

export type RadioButtonConfig = {
    options: RadioButtonOptionConfig[];
};

export type PrincipalSelectorConfig = {
    principalTypes: PrincipalType[];
    skipPrincipals: PrincipalKey[];
};

export type GeoPointConfig = Record<string, never>;

export type DateConfig = Record<string, never>;

export type DateTimeConfig = {
    useTimezone: boolean;
};

export type TimeConfig = Record<string, never>;

export type InstantConfig = Record<string, never>;

export type DateTimeRangeConfig = {
    useTimezone: boolean;
    fromLabel: string;
    toLabel: string;
    errorNoStart: string;
    errorEndInPast: string;
    errorEndBeforeStart: string;
    errorStartEqualsEnd: string;
    defaultFromTime: {hours: number; minutes: number} | undefined;
    defaultToTime: {hours: number; minutes: number} | undefined;
    fromPlaceholder: string;
    toPlaceholder: string;
    optionalFrom: boolean;
};

export type InputTypeConfig =
    | TextLineConfig
    | TextAreaConfig
    | NumberConfig
    | CheckboxConfig
    | ComboBoxConfig
    | RadioButtonConfig
    | PrincipalSelectorConfig
    | GeoPointConfig
    | DateConfig
    | DateTimeConfig
    | TimeConfig
    | InstantConfig
    | DateTimeRangeConfig;
