import {ApplicationKey} from '../../application/ApplicationKey';
import {ApplicationBasedName} from '../../application/ApplicationBasedName';
import {assertNotNull} from '../../util/Assert';

export class ContentTypeName
    extends ApplicationBasedName {

    // Built-in ContentTypes can be listed here
    static UNSTRUCTURED: ContentTypeName = ContentTypeName.from(ApplicationKey.BASE, 'unstructured');

    static FOLDER: ContentTypeName = ContentTypeName.from(ApplicationKey.BASE, 'folder');

    static SHORTCUT: ContentTypeName = ContentTypeName.from(ApplicationKey.BASE, 'shortcut');

    static MEDIA: ContentTypeName = ContentTypeName.from(ApplicationKey.BASE, 'media');

    static MEDIA_TEXT: ContentTypeName = ContentTypeName.from(ApplicationKey.MEDIA, 'text');

    static MEDIA_DATA: ContentTypeName = ContentTypeName.from(ApplicationKey.MEDIA, 'data');

    static MEDIA_AUDIO: ContentTypeName = ContentTypeName.from(ApplicationKey.MEDIA, 'audio');

    static MEDIA_VIDEO: ContentTypeName = ContentTypeName.from(ApplicationKey.MEDIA, 'video');

    static MEDIA_IMAGE: ContentTypeName = ContentTypeName.from(ApplicationKey.MEDIA, 'image');

    static MEDIA_VECTOR: ContentTypeName = ContentTypeName.from(ApplicationKey.MEDIA, 'vector');

    static MEDIA_ARCHIVE: ContentTypeName = ContentTypeName.from(ApplicationKey.MEDIA, 'archive');

    static MEDIA_DOCUMENT: ContentTypeName = ContentTypeName.from(ApplicationKey.MEDIA, 'document');

    static MEDIA_SPREADSHEET: ContentTypeName = ContentTypeName.from(ApplicationKey.MEDIA, 'spreadsheet');

    static MEDIA_PRESENTATION: ContentTypeName = ContentTypeName.from(ApplicationKey.MEDIA, 'presentation');

    static MEDIA_CODE: ContentTypeName = ContentTypeName.from(ApplicationKey.MEDIA, 'code');

    static MEDIA_EXECUTABLE: ContentTypeName = ContentTypeName.from(ApplicationKey.MEDIA, 'executable');

    static MEDIA_UNKNOWN: ContentTypeName = ContentTypeName.from(ApplicationKey.MEDIA, 'unknown');

    static SITE: ContentTypeName = ContentTypeName.from(ApplicationKey.PORTAL, 'site');

    static PAGE_TEMPLATE: ContentTypeName = ContentTypeName.from(ApplicationKey.PORTAL, 'page-template');

    static TEMPLATE_FOLDER: ContentTypeName = ContentTypeName.from(ApplicationKey.PORTAL, 'template-folder');

    static FRAGMENT: ContentTypeName = ContentTypeName.from(ApplicationKey.PORTAL, 'fragment');

    static IMAGE: ContentTypeName = ContentTypeName.from(ApplicationKey.MEDIA, 'image');

    constructor(name: string) {
        assertNotNull(name, 'Content type name can\'t be null');
        let parts = name.split(ApplicationBasedName.SEPARATOR);
        super(ApplicationKey.fromString(parts[0]), parts[1]);
    }

    static from(applicationKey: ApplicationKey, localName: string) {
        return new ContentTypeName(applicationKey.toString() + ':' + localName);
    }

    static getMediaTypes(): ContentTypeName[] {
        return [
            ContentTypeName.MEDIA_ARCHIVE,
            ContentTypeName.MEDIA_AUDIO,
            ContentTypeName.MEDIA_VIDEO,
            ContentTypeName.MEDIA_CODE,
            ContentTypeName.MEDIA_DATA,
            ContentTypeName.MEDIA_DOCUMENT,
            ContentTypeName.MEDIA_EXECUTABLE,
            ContentTypeName.MEDIA_IMAGE,
            ContentTypeName.MEDIA_SPREADSHEET,
            ContentTypeName.MEDIA_PRESENTATION,
            ContentTypeName.MEDIA_VECTOR,
            ContentTypeName.MEDIA_TEXT,
            ContentTypeName.MEDIA_UNKNOWN
        ];
    }

    isFolder(): boolean {
        return ContentTypeName.FOLDER.equals(this);
    }

    isSite(): boolean {
        return ContentTypeName.SITE.equals(this);
    }

    isPageTemplate(): boolean {
        return ContentTypeName.PAGE_TEMPLATE.equals(this);
    }

    isTemplateFolder(): boolean {
        return ContentTypeName.TEMPLATE_FOLDER.equals(this);
    }

    isFragment(): boolean {
        return ContentTypeName.FRAGMENT.equals(this);
    }

    isImage(): boolean {
        return ContentTypeName.IMAGE.equals(this);
    }

    isMedia(): boolean {
        return ContentTypeName.MEDIA.equals(this);
    }

    isVectorMedia(): boolean {
        return ContentTypeName.MEDIA_VECTOR.equals(this);
    }

    isAudioMedia(): boolean {
        return ContentTypeName.MEDIA_AUDIO.equals(this);
    }

    isVideoMedia(): boolean {
        return ContentTypeName.MEDIA_VIDEO.equals(this);
    }

    isDocumentMedia(): boolean {
        return ContentTypeName.MEDIA_DOCUMENT.equals(this);
    }

    isTextMedia(): boolean {
        return ContentTypeName.MEDIA_TEXT.equals(this);
    }

    isShortcut(): boolean {
        return ContentTypeName.SHORTCUT.equals(this);
    }

    isUnstructured(): boolean {
        return ContentTypeName.UNSTRUCTURED.equals(this);
    }

    isDescendantOfMedia(): boolean {
        return ContentTypeName.getMediaTypes().some((contentTypeName: ContentTypeName) => {
            return contentTypeName.equals(this);
        });
    }

    public static fromObject(o: object): ContentTypeName {
        if (o instanceof ContentTypeName) {
            return o;
        } else {
            return new ContentTypeName(o['refString']);
        }
    }
}
