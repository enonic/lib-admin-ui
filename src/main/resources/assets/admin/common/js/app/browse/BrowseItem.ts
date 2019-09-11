import {Equitable} from '../../Equitable';
import {ViewItem} from '../view/ViewItem';
import {ObjectHelper} from '../../ObjectHelper';

export class BrowseItem<M extends Equitable>
    extends ViewItem<M> {

    private id: string;

    setId(value: string): BrowseItem<M> {
        this.id = value;
        return this;
    }

    getId(): string {
        return this.id;
    }

    equals(o: Equitable): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(o, BrowseItem)) {
            return false;
        }
        const other = <BrowseItem<M>> o;
        return this.id === other.getId() && super.equals(o);
    }
}
