import {Action} from '../../Action';
import {BrowseItem} from '../../../app/browse/BrowseItem';
import {BrowseItemsChanges} from '../../../app/browse/BrowseItemsChanges';
import {Equitable} from '../../../Equitable';

export interface TreeGridActions<M extends Equitable> {

    getAllActions(): Action[];

    updateActionsEnabledState(browseItems: BrowseItem<M>[], changes?: BrowseItemsChanges<any>): Q.Promise<void>;

}
