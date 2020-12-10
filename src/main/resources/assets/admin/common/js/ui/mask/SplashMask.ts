import {DivEl} from '../../dom/DivEl';
import {Element} from '../../dom/Element';
import {Mask} from './Mask';
import {StyleHelper} from '../../StyleHelper';
import {Body} from '../../dom/Body';

export class SplashMask
    extends Mask {

    private shader: DivEl;

    private splash: DivEl;

    private splashContents: Element[];

    private hideOnScroll: boolean;

    private hideOnOutsideClick: boolean;

    constructor(elementToMask?: Element) {
        super(elementToMask);
        this.addClass(StyleHelper.COMMON_PREFIX + 'splash-mask');

        this.shader = new DivEl('mask-shader');
        this.splash = new DivEl('mask-splash');
        this.appendChildren(this.shader, this.splash);

        const wheelListener = _event => {
            if (this.isVisible()) {
                this.hide();
            }
        };
        const clickListener = _event => {
            if (!this.getEl().contains(_event.target)) {
                this.hide();
            }
        };

        this.onShown(_event => {
            if (this.hideOnScroll) {
                Body.get().onMouseWheel(wheelListener);
            }
            if (this.hideOnOutsideClick) {
                Body.get().onClicked(clickListener);
            }
        });
        this.onHidden(_event => {
            if (this.hideOnScroll) {
                Body.get().unMouseWheel(wheelListener);
            }
            if (this.hideOnOutsideClick) {
                Body.get().unClicked(clickListener);
            }
        });
    }

    show() {
        super.show();
        this.centerSplash();
    }

    hide() {
        super.hide();
    }

    setHideOnScroll(flag: boolean): void {
        this.hideOnScroll = flag;
    }

    getHideOnScroll(): boolean {
        return this.hideOnScroll;
    }

    setHideOnOutsideClick(flag: boolean): void {
        this.hideOnOutsideClick = flag;
    }

    getHideOnOutsideClick(): boolean {
        return this.hideOnOutsideClick;
    }

    setContents(...contents: Element[]): void {
        if (this.splashContents?.length > 0) {
            this.splash.removeChildren();
        }
        this.splashContents = contents;
        if (contents?.length > 0) {
            this.splash.appendChildren(...this.splashContents);
        }
        if (this.isVisible()) {
            this.centerSplash();
        }
    }

    getContents(): Element[] {
        return this.splashContents;
    }

    private centerSplash() {
        let loaderEl = this.splash.getEl();
        loaderEl.setMarginLeft('-' + loaderEl.getWidthWithBorder() / 2 + 'px');
        loaderEl.setMarginTop('-' + loaderEl.getHeightWithBorder() / 2 + 'px');
    }
}
