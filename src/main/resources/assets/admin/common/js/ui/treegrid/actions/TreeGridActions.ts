import Q from 'q';
import {IDentifiable} from '../../../IDentifiable';
import {Action} from '../../Action';

export interface TreeGridActions<M extends IDentifiable> {

    getAllActions(): Action[];

    updateActionsEnabledState(browseItems: M[]): Q.Promise<void>;

}
