import {Element, ElementFromHelperBuilder} from './Element';
import {ResponsiveManager} from '../ui/responsive/ResponsiveManager';
import {ElementHelper} from './ElementHelper';
import {BrowserHelper} from '../BrowserHelper';
import {Store} from '../store/Store';

export const BODY_KEY: string = 'Body';

export class Body
    extends Element {

    private childrenLoaded: boolean;

    constructor(loadExistingChildren: boolean = false, body?: HTMLElement) {
        if (!body) {
            body = document.body;
        }
        let html = Element.fromHtmlElement(body.parentElement);

            if (BrowserHelper.isIE() && html.getEl().getChild(0) instanceof HTMLHeadElement) {
                html.insertChild(Element.fromHtmlElement(html.getEl().getChild(1) as HTMLElement), 1);
            }

        super(new ElementFromHelperBuilder().setHelper(new ElementHelper(body)).setLoadExistingChildren(loadExistingChildren));

        html.appendChild(this);

        if (BrowserHelper.isIE()) {
            this.addClass('IE');
        }

        let visibilityHandler = () => {
            this.init().then(() => {
                this.childrenLoaded = loadExistingChildren;
            });
        };
        if (!document.hidden) {
            visibilityHandler();
        } else {
            let visibilityListener = () => {
                if (!document.hidden && !this.isRendered() && !this.isRendering()) {
                    visibilityHandler();
                    document.removeEventListener('visibilitychange', visibilityListener);
                }
            };
            document.addEventListener('visibilitychange', visibilityListener);
        }
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
