module api.app.browse {

    import ViewItem = api.app.view.ViewItem;

    export class BrowseItem<M> extends ViewItem<M> {

        private id: string;

        setId(value: string): api.app.browse.BrowseItem<M> {
            this.id = value;
            return this;
        }

        getId(): string {
            return this.id;
        }

        equals(o: api.Equitable): boolean {
            if (!api.ObjectHelper.iFrameSafeInstanceOf(o, BrowseItem)) {
                return false;
            }
            const other = <BrowseItem<M>> o;
            return this.id === other.getId() && super.equals(o);
        }
    }

}
