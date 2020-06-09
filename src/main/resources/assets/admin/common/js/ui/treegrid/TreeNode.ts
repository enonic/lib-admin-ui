import {Viewer} from '../Viewer';
import {ArrayHelper} from '../../util/ArrayHelper';

export class TreeNode<DATA>
    implements Slick.SlickData {

    private static EMPTY_DATA_ID_PREFFIX: string = '_empty_';
    private id: string;
    private dataId: string;
    private data: DATA;
    private expanded: boolean;
    private selectable: boolean;
    private selected: boolean;
    private pinned: boolean;
    private maxChildren: number;
    private parent: TreeNode<DATA>;
    private children: TreeNode<DATA>[];
    /**
     * A cache for stashing viewers by name, so that they can be reused.
     */
    private viewersByName: { [s: string]: Viewer<any>; } = {};

    constructor(builder: TreeNodeBuilder<DATA>) {
        this.id = Math.random().toString(36).substring(2);
        this.dataId = builder.getDataId();
        this.data = builder.getData();
        this.parent = builder.getParent();
        this.setChildren(builder.getChildren());
        this.maxChildren = builder.getMaxChildren();
        this.expanded = builder.isExpanded();
        this.selectable = builder.isSelectable();
        this.selected = builder.isSelected();
        this.pinned = builder.isPinned();
        if (this.pinned) {
            this.pinToRoot();
        }
    }

    getId(): string {
        return this.id;
    }

    hasData(): boolean {
        return !!this.data;
    }

    getDataId(): string {
        return this.dataId;
    }

    isExpanded(): boolean {
        return this.expanded;
    }

    setExpanded(expanded: boolean = true) {
        this.expanded = expanded;
    }

    isSelectable(): boolean {
        return this.selectable;
    }

    isSelected(): boolean {
        return this.selected;
    }

    setSelectable(selectable: boolean = true) {
        this.selectable = selectable;
    }

    setSelected(selected: boolean = true) {
        this.selected = selected;
    }

    isPinned(): boolean {
        return this.pinned;
    }

    getMaxChildren(): number {
        return this.maxChildren;
    }

    setMaxChildren(maxChildren: number) {
        this.maxChildren = maxChildren;
    }

    getData(): DATA {
        return this.data;
    }

    setData(data: DATA) {
        this.data = data;
    }

    setDataId(dataId: string) {
        this.dataId = dataId;
    }

    setViewer(name: string, viewer: Viewer<any>) {
        this.viewersByName[name] = viewer;
    }

    clearViewers() {
        this.viewersByName = {};
    }

    getViewer(name: string): Viewer<any> {
        return this.viewersByName[name];
    }

    getParent(): TreeNode<DATA> {
        return this.parent;
    }

    setParent(parent: TreeNode<DATA>) {
        this.parent = parent;
        if (this.pinned) {
            this.pinToRoot();
        }
    }

    hasParent(): boolean {
        return !!this.parent;
    }

    getRoot(): TreeNode<DATA> {
        let root: TreeNode<DATA> = this;
        let parent: TreeNode<DATA> = this.getParent();
        while (parent) {
            root = parent;
            parent = parent.getParent();
        }

        return root;
    }

    getChildren(): TreeNode<DATA>[] {
        return this.children;
    }

    setChildren(children: TreeNode<DATA>[]) {
        this.children = children;
        this.removeDuplicates();

        this.children.forEach((child) => {
            child.setParent(this);
        });
    }

    hasChildren(): boolean {
        return this.children.length > 0;
    }

    regenerateId(): void {
        this.id = Math.random().toString(36).substring(2);
    }

    regenerateIds(): void {
        this.regenerateId();
        this.children.forEach((elem) => {
            elem.regenerateIds();
        });
    }

    insertChild(child: TreeNode<DATA>, index: number = 0) {
        this.children = this.children || [];
        this.children.splice(index, 0, child);
        this.removeDuplicates();
        this.clearViewers();
        child.setParent(this);
    }

    moveChild(child: TreeNode<DATA>, index: number = 0) {
        this.removeChild(child);
        this.insertChild(child, index);
    }

    addChild(child: TreeNode<DATA>, isToBegin?: boolean) {
        this.children = this.children || [];
        if (isToBegin) {
            this.children.unshift(child);
        } else {
            this.children.push(child);
        }
        this.removeDuplicates();
        this.clearViewers();
        child.setParent(this);
    }

    updateChild(child: TreeNode<DATA>) {
        if (!child) {
            return;
        }
        for (let curChildIndex in this.children) {
            if (this.children[curChildIndex].getId() === child.getId()) {
                this.children[curChildIndex] = child;

                this.removeDuplicates();
                this.clearViewers();
                child.setParent(this);

                break;
            }
        }
    }

    removeChild(child: TreeNode<DATA>) {
        let children: TreeNode<DATA>[] = [];
        for (let i = 0; i < this.children.length; i++) {
            if (this.children[i].getId() !== child.getId()) {
                children.push(this.children[i]);
            }
        }
        this.children = children;

        if (this.children.length === 0 && !!this.getParent()) {
            this.expanded = false;
        }
    }

    removeChildren() {
        this.children.length = 0;
        this.expanded = false;
        this.clearViewers();
    }

    remove() {
        if (this.parent) {
            this.parent.removeChild(this);
            this.parent.clearViewers();
            this.parent = null;
        }
    }

    setEmptyDataId() {
        this.dataId = TreeNode.EMPTY_DATA_ID_PREFFIX + this.id;
    }

    isEmptyDataId(): boolean {
        return this.dataId === '' || this.dataId === TreeNode.EMPTY_DATA_ID_PREFFIX + this.id;
    }

    /*
     Element is visible, if all parents are expanded
     */
    isVisible(): boolean {
        let visible = true;
        let parent = this.parent;
        while (parent && visible) {
            visible = parent.isExpanded();
            parent = parent.getParent();
        }
        return visible;
    }

    /**
     * Transforms tree into the list of nodes with current node as root.
     * @param empty    - determines to get nodes with empty data.
     * @param expanded - determines to display only reachable nodes.
     * @param selected - determines to display only seleted nodes.
     */
    treeToList(empty: boolean = false, expanded: boolean = true, selected: boolean = false): TreeNode<DATA>[] {
        let list: TreeNode<DATA>[] = [];

        if (this.selected === true || selected === false) {
            if (this.getData() || empty === true) {
                list.push(this);
            }
        }

        if (this.expanded === true || expanded === false) {
            this.children.forEach((child) => {
                list = list.concat(child.treeToList(empty, expanded, selected));
            });
        }

        return list;
    }

    findNode(dataId: string): TreeNode<DATA> {

        if (this.hasData() && this.getDataId() === dataId) {
            return this;
        }

        for (let i = 0; i < this.children.length; i++) {
            let child = this.children[i].findNode(dataId);
            if (child) {
                return child;
            }
        }

        return null;
    }

    findNodes(dataId: string): TreeNode<DATA>[] {

        if (this.hasData() && this.getDataId() === dataId) {
            return [this];
        }

        let nodes = [];

        this.children.forEach((el) => {
            let children = el.findNodes(dataId);
            if (!!children) {
                nodes = nodes.concat(children);
            }
        });

        return !nodes ? null : nodes;
    }

    calcLevel(): number {
        let parent = this.parent;
        let lvl = 0;
        while (parent) {
            parent = parent.getParent();
            lvl++;
        }

        return lvl;
    }

    pinToRoot() {
        // Not already in the root
        if (this.calcLevel() > 1 && this.data && this.parent) {
            let duplicated = false;
            let relatives = this.getRoot().getChildren();
            // check if duplicate is already in root
            for (let i = 0; i < relatives.length; i++) {
                if (relatives[i].getData() && relatives[i].getDataId() === this.getDataId()) {
                    duplicated = true;
                    break;
                }
            }

            if (!duplicated) {
                if (this.pinned) {
                    this.parent.removeChild(this);
                    this.getRoot().addChild(this);
                } else {
                    new TreeNodeBuilder<DATA>(this).setPinned(true).build();
                }
            }
        }
    }

    // TS fix: common fields with Slick.SlickData
    public test(): any { /* empty */
    }

    private removeDuplicates() {
        this.children = ArrayHelper.removeDuplicates(this.children, (child) => child.getDataId());
    }
}

export class TreeNodeBuilder<NODE> {

    private dataId: string;

    private data: NODE;

    private expanded: boolean;

    private selectable: boolean;

    private selected: boolean;

    private pinned: boolean;

    private maxChildren: number;

    private parent: TreeNode<NODE>;

    private children: TreeNode<NODE>[];

    constructor(node?: TreeNode<NODE>) {
        if (node) {
            this.data = node.getData();
            this.parent = node.getParent();
            this.children = node.getChildren() || [];
            this.maxChildren = node.getMaxChildren();
            this.selectable = node.isSelectable();
        } else {
            this.children = [];
            this.maxChildren = 0;
            this.selectable = true;
        }
        this.pinned = false;
        this.expanded = false;
        this.selected = false;
    }

    isExpanded(): boolean {
        return this.expanded;
    }

    setExpanded(expanded: boolean = true): TreeNodeBuilder<NODE> {
        this.expanded = expanded;
        return this;
    }

    isSelectable(): boolean {
        return this.selectable;
    }

    isSelected(): boolean {
        return this.selected;
    }

    setSelectable(selectable: boolean = true): TreeNodeBuilder<NODE> {
        this.selectable = selectable;
        return this;
    }

    setSelected(selected: boolean = true): TreeNodeBuilder<NODE> {
        this.selected = selected;
        return this;
    }

    isPinned(): boolean {
        return this.pinned;
    }

    setPinned(pinned: boolean = true): TreeNodeBuilder<NODE> {
        this.pinned = pinned;
        return this;
    }

    getMaxChildren(): number {
        return this.maxChildren;
    }

    setMaxChildren(maxChildren: number) {
        this.maxChildren = maxChildren;
    }

    getData(): NODE {
        return this.data;
    }

    getDataId(): string {
        return this.dataId;
    }

    setData(data: NODE, dataId: string): TreeNodeBuilder<NODE> {
        this.data = data;
        this.dataId = dataId;
        return this;
    }

    getParent(): TreeNode<NODE> {
        return this.parent;
    }

    setParent(parent: TreeNode<NODE>): TreeNodeBuilder<NODE> {
        this.parent = parent;
        return this;
    }

    getChildren(): TreeNode<NODE>[] {
        return this.children;
    }

    setChildren(children: TreeNode<NODE>[]): TreeNodeBuilder<NODE> {
        this.children = children;
        return this;
    }

    build(): TreeNode<NODE> {
        return new TreeNode<NODE>(this);
    }
}
