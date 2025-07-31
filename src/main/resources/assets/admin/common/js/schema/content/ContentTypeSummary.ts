import {Equitable} from '../../Equitable';
import {ObjectHelper} from '../../ObjectHelper';
import {StringHelper} from '../../util/StringHelper';
import {Schema, SchemaBuilder} from '../Schema';
import {ContentTypeName} from './ContentTypeName';
import {ContentTypeSummaryJson} from './ContentTypeSummaryJson';

export class ContentTypeSummary
    extends Schema
    implements Equitable {

    private readonly allowChildContent: boolean;

    private readonly abstract: boolean;

    private readonly final: boolean;

    private readonly superType: ContentTypeName;

    private readonly displayNameExpression: string;

    private readonly displayNameLabel: string;

    private readonly modifier: string;

    private readonly owner: string;

    private readonly allowedChildContentTypes: string[];

    constructor(builder: ContentTypeSummaryBuilder) {
        super(builder);

        this.allowChildContent = builder.allowChildContent;
        this.final = builder.final;
        this.abstract = builder.abstract;
        this.superType = builder.superType;
        this.displayNameExpression = builder.displayNameExpression;
        this.owner = builder.owner;
        this.modifier = builder.modifier;
        this.displayNameLabel = builder.displayNameLabel;
        this.allowedChildContentTypes = builder.allowedChildContentTypes;
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

    getAllowedChildContentTypes(): string[] {
        return this.allowedChildContentTypes;
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, ContentTypeSummary)) {
            return false;
        }

        if (!super.equals(o)) {
            return false;
        }

        let other = o as ContentTypeSummary;

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

    allowedChildContentTypes: string[];

    constructor(source?: ContentTypeSummary) {
        super(source);

        if (source) {
            this.allowChildContent = source.isAllowChildContent();
            this.abstract = source.isAbstract();
            this.final = source.isFinal();
            this.superType = source.getSuperType();
            this.displayNameExpression = source.getDisplayNameExpression();
            this.displayNameLabel = source.getDisplayNameLabel();
            this.modifier = source.getModifier();
            this.owner = source.getOwner();
            this.allowedChildContentTypes = source.getAllowedChildContentTypes();
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
        this.allowedChildContentTypes = json.allowChildContentType;
        return this;
    }

    build(): ContentTypeSummary {
        return new ContentTypeSummary(this);
    }
}
