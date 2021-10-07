import {Path, PathBuilder} from './rest/Path';
import {Equitable} from './Equitable';
import {ObjectHelper} from './ObjectHelper';

export class NodePath extends Path implements Equitable {

    public static NODE_PATH_DIVIDER: string = Path.DEFAULT_ELEMENT_DIVIDER;

    isRoot(): boolean {
        return this.getLevel() === 1;
    }

    isNotRoot(): boolean {
        return !this.isRoot();
    }

    getRootElement(): string {
        return this.elements[0];
    }

    equals(o: Equitable): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(o, NodePath)) {
            return false;
        }

        let other: NodePath = <NodePath>o;

        if (!ObjectHelper.stringEquals(this.refString, other.refString)) {
            return false;
        }

        return true;
    }

    isDescendantOf(path: NodePath): boolean {
        return (path.isRoot() || this.refString.indexOf(path.toString() + this.getDivider()) === 0) &&
               (this.getLevel() > path.getLevel());
    }

    isChildOf(path: NodePath): boolean {
        return (path.isRoot() || this.refString.indexOf(path.toString() + this.getDivider()) === 0) &&
               (this.getLevel() === path.getLevel() + 1);
    }

    newBuilder(): NodePathBuilder {
        return new NodePathBuilder(this);
    }

    public static create(): NodePathBuilder {
        return new NodePathBuilder();
    }

}

export class NodePathBuilder extends PathBuilder {

    elementDivider: string = NodePath.NODE_PATH_DIVIDER;

    fromString(s: string, elementDivider: string = NodePath.NODE_PATH_DIVIDER): NodePathBuilder {
        return <NodePathBuilder>super.fromString(s, elementDivider);
    }

    fromParent(parent: Path, ...childElements: string[]): NodePathBuilder {
        return <NodePathBuilder>super.fromParent(parent, ...childElements);
    }

    build(): NodePath {
        return new NodePath(this);
    }
}
