module api.dom {

    export class IFrameEl
        extends api.dom.Element {

        private loaded: boolean = false;

        constructor(className?: string) {
            super(new NewElementBuilder().setTagName('iframe').setClassName(className));

            this.onLoaded(() => this.loaded = true);
        }

        public setSrc(src: string): api.dom.IFrameEl {
            this.getEl().setAttribute('src', src);
            return this;
        }

        public getSrc(): string {
            return this.getEl().getAttribute('src');
        }

        public refresh() {
            const src = this.getEl().getAttribute('src');
            this.getEl().setAttribute('src', '');

            setTimeout(() => this.getEl().setAttribute('src', src), 10);

        }

        isLoaded() {
            return this.loaded;
        }

        postMessage(data: any, targetOrigin: string = '*') {
            let thisIFrameElement: HTMLIFrameElement = <HTMLIFrameElement>this.getHTMLElement();
            thisIFrameElement.contentWindow.postMessage(data, targetOrigin);
        }

        onLoaded(listener: (event: UIEvent) => void) {
            this.getEl().addEventListener('load', listener);
        }

        unLoaded(listener: (event: UIEvent) => void) {
            this.getEl().removeEventListener('load', listener);
        }
    }
}
