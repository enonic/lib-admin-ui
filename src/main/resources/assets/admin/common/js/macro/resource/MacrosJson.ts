import {FormJson} from '../../form/json/FormJson';

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
