import {Action} from './Action';

export interface ActionContainer {

    getActions(): Action[];
}
