module api.dom {

    import ResponsiveManager = api.ui.responsive.ResponsiveManager;

    export class Body
        extends Element {

        private static instance: Body;

        private childrenLoaded: boolean;

        constructor(loadExistingChildren: boolean = false, body?: HTMLElement) {
            if (!body) {
                body = document.body;
            }
            let html = Element.fromHtmlElement(body.parentElement);

            if (html.getEl().getChild(0) instanceof HTMLHeadElement) {
                html.insertChild(Element.fromHtmlElement(<HTMLElement>html.getEl().getChild(1)), 1);
            }

            super(new ElementFromHelperBuilder().setHelper(new ElementHelper(body)).setLoadExistingChildren(loadExistingChildren));

            html.appendChild(this);

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
            if (!Body.instance && document.body) {
                Body.instance = new Body();
                ResponsiveManager.onAvailableSizeChanged(Body.instance);
            }
            return Body.instance;
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
}
