import {PrincipalKey} from '../../../security/PrincipalKey';
import {PrincipalType} from '../../../security/PrincipalType';

export interface TextLineConfig {
    regexp: RegExp | null;
    maxLength: number;
    showCounter: boolean;
}

export interface TextAreaConfig {
    maxLength: number;
    showCounter: boolean;
}

export interface NumberConfig {
    min: number | null;
    max: number | null;
}

export interface CheckboxConfig {
    alignment: string;
}

export interface ComboBoxOptionConfig {
    label: string;
    value: string;
}

export interface ComboBoxConfig {
    options: ComboBoxOptionConfig[];
}

export interface RadioButtonOptionConfig {
    label: string;
    value: string;
}

export interface RadioButtonConfig {
    options: RadioButtonOptionConfig[];
}

export interface PrincipalSelectorConfig {
    principalTypes: PrincipalType[];
    skipPrincipals: PrincipalKey[];
}

export type GeoPointConfig = Record<string, never>;

export type DateConfig = Record<string, never>;

export interface DateTimeConfig {
    useTimezone: boolean;
}

export type TimeConfig = Record<string, never>;

export type InstantConfig = Record<string, never>;

export interface DateTimeRangeConfig {
    useTimezone: boolean;
    fromLabel: string;
    toLabel: string;
    errorNoStart: string;
    errorEndInPast: string;
    errorEndBeforeStart: string;
    errorStartEqualsEnd: string;
    defaultFromTime: { hours: number; minutes: number } | null;
    defaultToTime: { hours: number; minutes: number } | null;
    fromPlaceholder: string;
    toPlaceholder: string;
    optionalFrom: boolean;
}

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
