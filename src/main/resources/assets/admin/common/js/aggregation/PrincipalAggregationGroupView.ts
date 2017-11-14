module api.aggregation {

    export class PrincipalAggregationGroupView extends AggregationGroupView {

        initialize() {

            let mask: api.ui.mask.LoadMask = new api.ui.mask.LoadMask(this);
            this.appendChild(mask);
            this.onRendered((event: api.dom.ElementRenderedEvent) => {
                mask.show();
            });

            mask.remove();

        }

    }

}
