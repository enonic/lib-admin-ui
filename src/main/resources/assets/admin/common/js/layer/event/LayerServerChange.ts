module api.layer.event {

    import NodeServerChange = api.event.NodeServerChange;
    import NodeEventJson = api.event.NodeEventJson;
    import NodeServerChangeItem = api.event.NodeServerChangeItem;
    import NodeEventNodeJson = api.event.NodeEventNodeJson;
    import NodeServerChangeType = api.event.NodeServerChangeType;

    export class LayerServerChangeItem
        extends NodeServerChangeItem<string> {

        private layer: string;

        constructor(path: string, branch: string) {
            super(path, branch);

            this.layer = path.substr(1);
        }

        getLayer(): string {
            return this.layer;
        }

        static fromJson(node: NodeEventNodeJson): LayerServerChangeItem {
            return new LayerServerChangeItem(node.path.substr('/layers'.length), node.branch);
        }
    }

    export class LayerServerChange
        extends NodeServerChange<string> {

        toString(): string {
            return NodeServerChangeType[this.type] + ': <' +
                   this.changeItems.map((item) => item.getPath()).join(', ') + '>';
        }

        static fromJson(nodeEventJson: NodeEventJson): LayerServerChange {

            let changedItems = nodeEventJson.data.nodes.filter((node) => node.path.indexOf('/layers') === 0).map(
                (node: NodeEventNodeJson) => LayerServerChangeItem.fromJson(node));

            if (changedItems.length === 0) {
                return null;
            }

            let principalEventType = this.getNodeServerChangeType(nodeEventJson.type);
            return new LayerServerChange(principalEventType, changedItems, null);
        }
    }
}
