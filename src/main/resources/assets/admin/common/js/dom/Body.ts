import {Element, ElementFromHelperBuilder} from './Element';
import {ResponsiveManager} from '../ui/responsive/ResponsiveManager';
import {ElementHelper} from './ElementHelper';
import {Store} from '../store/Store';
import {CONFIG} from '../util/Config';

export const BODY_KEY: string = 'Body';

export class Body
    extends Element {

    private childrenLoaded: boolean;

    private focusedElement: Element;

    constructor(loadExistingChildren: boolean = false, body?: HTMLElement) {
        if (!body) {
            body = document.body;
        }

        const html = Element.fromHtmlElement(body.parentElement);
        html.setLang(CONFIG.getLocale());

        super(new ElementFromHelperBuilder().setHelper(new ElementHelper(body)).setLoadExistingChildren(loadExistingChildren));

        html.appendChild(this);

        const visibilityHandler = () => {
            this.init().then(() => {
                this.childrenLoaded = loadExistingChildren;
            });
        };
        if (!document.hidden) {
            visibilityHandler();
        } else {
            const visibilityListener = () => {
                if (!document.hidden && !this.isRendered() && !this.isRendering()) {
                    visibilityHandler();
                    document.removeEventListener('visibilitychange', visibilityListener);
                }
            };
            document.addEventListener('visibilitychange', visibilityListener);
        }
    }

    reapplyFocus() {
        setTimeout(() => {
            this.focusedElement?.giveFocus();
            this.focusedElement = null;
        }, 100);
    }

    setFocusedElement(element: Element) {
        this.focusedElement = element;
    }

    getFocusedElement(): Element {
        return this.focusedElement;
    }

    static get(): Body {
        let instance: Body = Store.instance().get(BODY_KEY);

        if (instance == null && document.body) {
            instance = new Body();
            Store.instance().set(BODY_KEY, instance);
            ResponsiveManager.onAvailableSizeChanged(instance);
        }

        return instance;
    }

    isChildrenLoaded(): boolean {
        return this.childrenLoaded;
    }

    loadExistingChildren(): Body {
        if (!this.isChildrenLoaded()) {
            super.loadExistingChildren();
            this.childrenLoaded = true;
        }
        return this;
    }

    isShowingModalDialog() {
        return Body.get().hasClass('modal-dialog');
    }
}
