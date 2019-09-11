import {NodeServerChangeType} from '../../event/NodeServerChange';
import {NodeEventJson, NodeServerEvent} from '../../event/NodeServerEvent';
import {PrincipalServerChange} from './PrincipalServerChange';

export class PrincipalServerEvent
    extends NodeServerEvent {

    constructor(change: PrincipalServerChange) {
        super(change);
    }

    static is(eventJson: NodeEventJson): boolean {
        return eventJson.data.nodes.some(node => node.path.indexOf('/identity') === 0);
    }

    static fromJson(nodeEventJson: NodeEventJson): PrincipalServerEvent {
        let change = PrincipalServerChange.fromJson(nodeEventJson);
        return new PrincipalServerEvent(change);
    }

    getType(): NodeServerChangeType {
        return this.getNodeChange() ? this.getNodeChange().getChangeType() : null;
    }

    getNodeChange(): PrincipalServerChange {
        return <PrincipalServerChange>super.getNodeChange();
    }
}
