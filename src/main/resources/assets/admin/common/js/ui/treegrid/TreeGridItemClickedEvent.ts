import {Event} from '../../event/Event';
import {ClassHelper} from '../../ClassHelper';
import {TreeNode} from './TreeNode';

export class TreeGridItemClickedEvent
    extends Event {

    private node: TreeNode<any>;

    private selection: boolean;

    constructor(node: TreeNode<any>, selection: boolean = false) {
        super();
        this.selection = selection;
        this.node = node;
    }

    static on(handler: (event: TreeGridItemClickedEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: TreeGridItemClickedEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }

    public hasSelection() {
        return this.selection;
    }

    public getTreeNode(): TreeNode<any> {
        return this.node;
    }
}
