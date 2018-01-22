module api.issue.event {

    import NodeServerChangeType = api.event.NodeServerChangeType;

    export class IssueServerEvent
        extends api.event.NodeServerEvent {

        constructor(change: IssueServerChange) {
            super(change);
        }

        getType(): NodeServerChangeType {
            return this.getNodeChange() ? this.getNodeChange().getChangeType() : null;
        }

        getNodeChange(): IssueServerChange {
            return <IssueServerChange>super.getNodeChange();
        }

        /*
         Comments are stored under the issue at /issues/issue-1/comment-2
         So we need to filter them out leaving just /issues/issue-N
          */
        static is(eventJson: api.event.NodeEventJson): boolean {
            return eventJson.data.nodes.some(node => /^\/issues\/issue-\d+$/.test(node.path));
        }

        static fromJson(nodeEventJson: api.event.NodeEventJson): IssueServerEvent {
            let change = IssueServerChange.fromJson(nodeEventJson);
            return new IssueServerEvent(change);
        }
    }
}
