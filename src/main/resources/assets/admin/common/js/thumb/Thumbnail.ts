import {Equitable} from '../Equitable';
import {BinaryReference} from '../util/BinaryReference';
import {ObjectHelper} from '../ObjectHelper';
import {ThumbnailJson} from './ThumbnailJson';

export class Thumbnail
    implements Equitable {

    private binaryReference: BinaryReference;

    private mimeType: string;

    private size: number;

    constructor(builder: ThumbnailBuilder) {
        this.binaryReference = builder.binaryReference;
        this.mimeType = builder.mimeType;
        this.size = builder.size;
    }

    public static create(): ThumbnailBuilder {
        return new ThumbnailBuilder();
    }

    getBinaryReference(): BinaryReference {
        return this.binaryReference;
    }

    getMimeType(): string {
        return this.mimeType;
    }

    getSize(): number {
        return this.size;
    }

    toJson(): ThumbnailJson {

        return {
            binaryReference: this.getBinaryReference().toString(),
            mimeType: this.getMimeType(),
            size: this.getSize()
        };
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, Thumbnail)) {
            return false;
        }

        let other = o as Thumbnail;

        if (!ObjectHelper.equals(this.binaryReference, other.binaryReference)) {
            return false;
        }
        if (!ObjectHelper.stringEquals(this.mimeType, other.mimeType)) {
            return false;
        }
        if (!ObjectHelper.numberEquals(this.size, other.size)) {
            return false;
        }
        return true;
    }

}

export class ThumbnailBuilder {

    binaryReference: BinaryReference;

    mimeType: string;

    size: number;

    public fromJson(json: ThumbnailJson): ThumbnailBuilder {
        this.binaryReference = new BinaryReference(json.binaryReference);
        this.mimeType = json.mimeType;
        this.size = json.size;
        return this;
    }

    public setBinaryReference(value: BinaryReference): ThumbnailBuilder {
        this.binaryReference = value;
        return this;
    }

    public setMimeType(value: string): ThumbnailBuilder {
        this.mimeType = value;
        return this;
    }

    public setSize(value: number): ThumbnailBuilder {
        this.size = value;
        return this;
    }

    public build(): Thumbnail {
        return new Thumbnail(this);
    }
}
