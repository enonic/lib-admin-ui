module api.form.inputtype.text {
    import Event = api.event.Event;

    export class _HtmlAreaResizeEvent
        extends Event {
        private htmlArea: _HtmlArea;

        constructor(htmlArea: _HtmlArea) {
            super();
            this.htmlArea = htmlArea;
        }

        getHtmlArea(): _HtmlArea {
            return this.htmlArea;
        }

        static on(handler: (event: _HtmlAreaResizeEvent) => void) {
            Event.bind(api.ClassHelper.getFullName(this), handler);
        }

        static un(handler?: (event: _HtmlAreaResizeEvent) => void) {
            Event.unbind(api.ClassHelper.getFullName(this), handler);
        }
    }
}
