import type {FormJson} from '@enonic/ui-types';

export interface MacrosJson {
    macros: MacroJson[];
}

export interface MacroJson {
    key: string;
    name: string;
    displayName: string;
    description: string;
    form: FormJson;
    iconUrl: string;
}
