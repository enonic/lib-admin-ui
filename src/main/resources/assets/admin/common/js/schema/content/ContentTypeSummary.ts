import {MixinNames} from '../mixin/MixinNames';
import {Schema, SchemaBuilder} from '../Schema';
import {Equitable} from '../../Equitable';
import {ContentTypeName} from './ContentTypeName';
import {StringHelper} from '../../util/StringHelper';
import {ObjectHelper} from '../../ObjectHelper';
import {ContentTypeSummaryJson} from './ContentTypeSummaryJson';

export class ContentTypeSummary
    extends Schema
    implements Equitable {

    private allowChildContent: boolean;

    private abstract: boolean;

    private final: boolean;

    private superType: ContentTypeName;

    private displayNameExpression: string;

    private displayNameLabel: string;

    private modifier: string;

    private owner: string;

    private metadata: MixinNames;

    constructor(builder: ContentTypeSummaryBuilder) {
        super(builder);
        this.allowChildContent = builder.allowChildContent;
        this.final = builder.final;
        this.abstract = builder.abstract;
        this.superType = builder.superType;
        this.displayNameExpression = builder.displayNameExpression;
        this.owner = builder.owner;
        this.modifier = builder.modifier;
        this.metadata = builder.metadata;
        this.displayNameLabel = builder.displayNameLabel;
    }

    static fromJsonArray(jsonArray: ContentTypeSummaryJson[]): ContentTypeSummary[] {
        let array: ContentTypeSummary[] = [];

        jsonArray.forEach((summaryJson: ContentTypeSummaryJson) => {
            array.push(ContentTypeSummary.fromJson(summaryJson));
        });
        return array;
    }

    static fromJson(json: ContentTypeSummaryJson): ContentTypeSummary {
        return new ContentTypeSummaryBuilder().fromContentTypeSummaryJson(json).build();
    }

    getContentTypeName(): ContentTypeName {
        return new ContentTypeName(this.getName());
    }

    isSite(): boolean {
        return this.getContentTypeName().isSite();
    }

    isPageTemplate(): boolean {
        return this.getContentTypeName().isPageTemplate();
    }

    isImage(): boolean {
        return this.getContentTypeName().isImage();
    }

    isShortcut(): boolean {
        return this.getContentTypeName().isShortcut();
    }

    isUnstructured(): boolean {
        return this.getContentTypeName().isUnstructured();
    }

    isFinal(): boolean {
        return this.final;
    }

    isAbstract(): boolean {
        return this.abstract;
    }

    isAllowChildContent(): boolean {
        return this.allowChildContent;
    }

    getSuperType(): ContentTypeName {
        return this.superType;
    }

    hasDisplayNameExpression(): boolean {
        return !StringHelper.isBlank(this.displayNameExpression);
    }

    getDisplayNameExpression(): string {
        return this.displayNameExpression;
    }

    getDisplayNameLabel(): string {
        return this.displayNameLabel;
    }

    getOwner(): string {
        return this.owner;
    }

    getModifier(): string {
        return this.modifier;
    }

    getMetadata(): MixinNames {
        return this.metadata;
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, ContentTypeSummary)) {
            return false;
        }

        if (!super.equals(o)) {
            return false;
        }

        let other = <ContentTypeSummary>o;

        if (!ObjectHelper.booleanEquals(this.allowChildContent, other.allowChildContent)) {
            return false;
        }

        if (!ObjectHelper.booleanEquals(this.abstract, other.abstract)) {
            return false;
        }

        if (!ObjectHelper.equals(this.superType, other.superType)) {
            return false;
        }

        if (!ObjectHelper.stringEquals(this.displayNameExpression, other.displayNameExpression)) {
            return false;
        }

        if (!ObjectHelper.stringEquals(this.displayNameLabel, other.displayNameLabel)) {
            return false;
        }

        if (!ObjectHelper.stringEquals(this.modifier, other.modifier)) {
            return false;
        }

        if (!ObjectHelper.stringEquals(this.owner, other.owner)) {
            return false;
        }

        if (!ObjectHelper.equals(this.metadata, other.metadata)) {
            return false;
        }

        return true;
    }

}

export class ContentTypeSummaryBuilder
    extends SchemaBuilder {

    allowChildContent: boolean;

    abstract: boolean;

    final: boolean;

    superType: ContentTypeName;

    displayNameExpression: string;

    displayNameLabel: string;

    modifier: string;

    owner: string;

    metadata: MixinNames;

    constructor(source?: ContentTypeSummary) {
        if (source) {
            super(source);
            this.allowChildContent = source.isAllowChildContent();
            this.abstract = source.isAbstract();
            this.final = source.isFinal();
            this.superType = source.getSuperType();
            this.displayNameExpression = source.getDisplayNameExpression();
            this.displayNameLabel = source.getDisplayNameLabel();
            this.modifier = source.getModifier();
            this.owner = source.getOwner();
            this.metadata = source.getMetadata();
        }
    }

    fromContentTypeSummaryJson(json: ContentTypeSummaryJson): ContentTypeSummaryBuilder {
        super.fromSchemaJson(json);

        this.allowChildContent = json.allowChildContent;
        this.final = json.final;
        this.abstract = json.abstract;
        this.superType = json.superType ? new ContentTypeName(json.superType) : null;
        this.displayNameExpression = json.displayNameExpression;
        this.displayNameLabel = json.displayNameLabel;
        this.owner = json.owner;
        this.modifier = json.modifier;
        this.metadata = MixinNames.create().fromStrings(json.metadata).build();
        return this;
    }

    build(): ContentTypeSummary {
        return new ContentTypeSummary(this);
    }
}
