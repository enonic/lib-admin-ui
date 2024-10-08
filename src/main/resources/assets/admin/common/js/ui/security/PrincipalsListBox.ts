import {LazyListBox} from '../selector/list/LazyListBox';
import {Principal} from '../../security/Principal';
import {PrincipalViewer} from './PrincipalViewer';
import {PrincipalLoader} from '../../security/PrincipalLoader';
import {Element} from '../../dom/Element';

export class PrincipalsListBox
    extends LazyListBox<Principal> {

    private readonly loader: PrincipalLoader;

    constructor(loader: PrincipalLoader) {
        super('principals-list-box');

        this.loader = loader;
    }

    protected createItemView(item: Principal, readOnly: boolean): PrincipalViewer {
        const viewer = new PrincipalViewer();
        viewer.setObject(item);
        return viewer;
    }

    protected getItemId(item: Principal): string {
        return item.getKey().toString();
    }

    protected handleLazyLoad(): void {
        super.handleLazyLoad();

        if (this.loader.isPartiallyLoaded()) {
            this.loader.load(true);
        }
    }

    protected getScrollContainer(): Element {
        return this;
    }
}
