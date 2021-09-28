import {NodeEventNodeJson} from './NodeServerEvent';

export class NodeServerChangeItem {

    protected readonly id: string;

    protected readonly path: string;

    protected readonly newPath: string;

    protected readonly branch: string;

    protected readonly repo: string;

    constructor(builder: NodeServerChangeItemBuilder) {
        this.id = builder.id;
        this.branch = builder.branch;
        this.repo = builder.repo;
        this.path = this.processPath(builder.path);
        this.newPath = builder.newPath;
    }

    protected processPath(path: string): string {
        return path;
    }

    getId(): string {
        return this.id;
    }

    getPath(): string {
        return this.path;
    }

    getNewPath(): string {
        return this.newPath;
    }

    getBranch(): string {
        return this.branch;
    }

    getRepo(): string {
        return this.repo;
    }
}

export class NodeServerChangeItemBuilder {

    id: string;

    path: string;

    newPath: string;

    branch: string;

    repo: string;

    fromJson(json: NodeEventNodeJson): NodeServerChangeItemBuilder {
        this.id = json.id;
        this.branch = json.branch;
        this.repo = json.repo;
        this.path = json.path;
        this.newPath = json.newPath;

        return this;
    }

    setId(value: string): NodeServerChangeItemBuilder {
        this.id = value;
        return this;
    }

    setPath(value: string): NodeServerChangeItemBuilder {
        this.path = value;
        return this;
    }

    setNewPath(value: string): NodeServerChangeItemBuilder {
        this.newPath = value;
        return this;
    }

    setBranch(value: string): NodeServerChangeItemBuilder {
        this.branch = value;
        return this;
    }

    setRepo(value: string): NodeServerChangeItemBuilder {
        this.repo = value;
        return this;
    }

    build(): NodeServerChangeItem {
        return new NodeServerChangeItem(this);
    }
}
