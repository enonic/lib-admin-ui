module api.layer.event {

    import NodeServerChangeType = api.event.NodeServerChangeType;

    export class LayerServerEvent
        extends api.event.NodeServerEvent {

        constructor(change: LayerServerChange) {
            super(change);
        }

        getType(): NodeServerChangeType {
            return this.getNodeChange() ? this.getNodeChange().getChangeType() : null;
        }

        getNodeChange(): LayerServerChange {
            return <LayerServerChange>super.getNodeChange();
        }

        static is(eventJson: api.event.NodeEventJson): boolean {
            return eventJson.data.nodes.some(node => node.path.indexOf('/layers') === 0);
        }

        static fromJson(nodeEventJson: api.event.NodeEventJson): LayerServerEvent {
            let change = LayerServerChange.fromJson(nodeEventJson);
            return new LayerServerEvent(change);
        }
    }
}
