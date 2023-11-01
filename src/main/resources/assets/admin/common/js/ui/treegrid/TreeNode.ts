import '@enonic/legacy-slickgrid/slick.core'; // This needs jQuery and probably jQuery UI.


import {Viewer} from '../Viewer';
import {ArrayHelper} from '../../util/ArrayHelper';
import {IDentifiable} from '../../IDentifiable';

export class TreeNode<DATA extends IDentifiable>
    implements Slick.SlickData {

    private id: string;
    private data: DATA;
    private expandable: boolean;
    private expanded: boolean;
    private selectable: boolean;
    private selected: boolean;
    private maxChildren: number;
    private parent: TreeNode<DATA>;
    private children: TreeNode<DATA>[];
    /**
     * A cache for stashing viewers by name, so that they can be reused.
     */
    private viewersByName: Record<string, Viewer<any>> = {};

    constructor(builder: TreeNodeBuilder<DATA>) {
        this.id = Math.random().toString(36).substring(2);
        this.data = builder.getData();
        this.parent = builder.getParent();
        this.setChildren(builder.getChildren());
        this.maxChildren = builder.getMaxChildren();
        this.expandable = builder.isExpandable();
        this.expanded = builder.isExpanded();
        this.selectable = builder.isSelectable();
        this.selected = builder.isSelected();
    }

    getId(): string {
        return this.id;
    }

    hasData(): boolean {
        return !!this.data;
    }

    getDataId(): string {
        return this.hasData() ? this.getData().getId() : null;
    }

    isExpandable(): boolean {
        return this.expandable;
    }

    setExpandable(value: boolean) {
        this.expandable = value;
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
    }

    hasParent(): boolean {
        return !!this.parent;
    }

    getRoot(): TreeNode<DATA> {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
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
        // eslint-disable-next-line @typescript-eslint/no-for-in-array
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

    removeChild(targetChild: TreeNode<DATA>) {
        let children: TreeNode<DATA>[] = [];
        for (const child of this.children) {
            if (child.getId() !== targetChild.getId()) {
                children.push(child);
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

        for (const child of this.children) {
            const childNode = child.findNode(dataId);
            if (childNode) {
                return childNode;
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

    // TS fix: common fields with Slick.SlickData
    public test(): any { /* empty */
    }

    private removeDuplicates() {
        this.children = ArrayHelper.removeDuplicates(this.children, (child) => child.getDataId());
    }
}

export class TreeNodeBuilder<DATA extends IDentifiable> {

    private data: DATA;

    private expanded: boolean;

    private selectable: boolean;

    private selected: boolean;

    private maxChildren: number;

    private parent: TreeNode<DATA>;

    private children: TreeNode<DATA>[];

    private expandable: boolean;

    constructor(node?: TreeNode<DATA>) {
        if (node) {
            this.data = node.getData();
            this.parent = node.getParent();
            this.children = node.getChildren() || [];
            this.maxChildren = node.getMaxChildren();
            this.selectable = node.isSelectable();
            this.expandable = node.isExpandable();
        } else {
            this.children = [];
            this.maxChildren = 0;
            this.selectable = true;
            this.expandable = false;
        }
        this.expanded = false;
        this.selected = false;
    }

    isExpanded(): boolean {
        return this.expanded;
    }

    setExpanded(expanded: boolean = true): TreeNodeBuilder<DATA> {
        this.expanded = expanded;
        return this;
    }

    isSelectable(): boolean {
        return this.selectable;
    }

    isSelected(): boolean {
        return this.selected;
    }

    setSelectable(selectable: boolean = true): TreeNodeBuilder<DATA> {
        this.selectable = selectable;
        return this;
    }

    setSelected(selected: boolean = true): TreeNodeBuilder<DATA> {
        this.selected = selected;
        return this;
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

    setData(data: DATA): TreeNodeBuilder<DATA> {
        this.data = data;
        return this;
    }

    getParent(): TreeNode<DATA> {
        return this.parent;
    }

    setParent(parent: TreeNode<DATA>): TreeNodeBuilder<DATA> {
        this.parent = parent;
        return this;
    }

    getChildren(): TreeNode<DATA>[] {
        return this.children;
    }

    setChildren(children: TreeNode<DATA>[]): TreeNodeBuilder<DATA> {
        this.children = children;
        return this;
    }

    setExpandable(value: boolean): TreeNodeBuilder<DATA> {
        this.expandable = value;
        return this;
    }

    isExpandable(): boolean {
        return this.expandable;
    }

    build(): TreeNode<DATA> {
        return new TreeNode<DATA>(this);
    }
}
