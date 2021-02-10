import * as Q from 'q';
import {Action} from '../../Action';
import {IDentifiable} from '../../../IDentifiable';

export interface TreeGridActions<M extends IDentifiable> {

    getAllActions(): Action[];

    updateActionsEnabledState(browseItems: M[]): Q.Promise<void>;

}
