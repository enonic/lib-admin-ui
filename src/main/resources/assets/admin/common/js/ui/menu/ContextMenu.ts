import {Action} from '../Action';
import {Body} from '../../dom/Body';
import {Menu} from './Menu';

export class ContextMenu
    extends Menu {

    private readonly onBodyClicked: (e: MouseEvent) => void;

    constructor(actions?: Action[], appendToBody: boolean = true) {
        super(actions);

        this.addClass('context-menu');

        this.onBodyClicked = (e) => this.hideMenuOnOutsideClick(e);
        if (appendToBody) {
            Body.get().appendChild(this);
        }
    }

    show() {
        super.show();

        Body.get().unClicked(this.onBodyClicked);
        Body.get().unContextMenu(this.onBodyClicked);

        setTimeout(() => {
            Body.get().onClicked(this.onBodyClicked);
            Body.get().onContextMenu(this.onBodyClicked);
        }, 1);
    }

    hide() {
        super.hide();
        Body.get().unClicked(this.onBodyClicked);
        Body.get().unContextMenu(this.onBodyClicked);
    }

    showAt(x: number, y: number) {
        // referencing through prototype to be able to call this function with context other than this
        // i.e this.showAt.call(other, x, y)
        ContextMenu.prototype.doMoveTo(this, x, y);
        this.show();
    }

    moveBy(dx: number, dy: number) {
        let offset = this.getEl().getOffsetToParent();
        // referencing through prototype to be able to call this function with context other than this
        // i.e this.moveBy.call(other, x, y)
        ContextMenu.prototype.doMoveTo(this, offset.left + dx, offset.top + dy);
    }

    doMoveTo(menu: ContextMenu, x: number, y: number) {
        menu.getEl().setLeftPx(x).setTopPx(y);
    }

    private hideMenuOnOutsideClick(evt: Event): void {
        if (!this.getEl().contains(evt.target as HTMLElement)) {
            // click outside menu
            this.hide();
        }
    }
}
