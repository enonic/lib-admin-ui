module api.app.browse {

    export class BrowseItem<M extends api.Equitable> extends api.app.view.ViewItem<M> {

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
