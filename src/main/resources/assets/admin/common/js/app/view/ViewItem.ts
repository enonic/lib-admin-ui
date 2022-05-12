import {Equitable} from '../../Equitable';
import {IDentifiable} from '../../IDentifiable';

export interface ViewItem
    extends Equitable, IDentifiable {

    getDisplayName(): string;

    getIconClass(): string;

    getIconUrl(): string;

    getIconSrc?(): string;
}
