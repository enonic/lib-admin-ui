module api.content.event {

    import Event = api.event.Event;

    export class FormEditEvent
        extends Event {

        private model: ContentSummary;

        constructor(model: ContentSummary) {
            super();
            this.model = model;
        }

        getModels(): ContentSummary {
            return this.model;
        }

        static on(handler: (event: FormEditEvent) => void, contextWindow: Window = window) {
            api.event.Event.bind(api.ClassHelper.getFullName(this), handler, contextWindow);
        }

        static un(handler?: (event: FormEditEvent) => void, contextWindow: Window = window) {
            api.event.Event.unbind(api.ClassHelper.getFullName(this), handler, contextWindow);
        }
    }
}
