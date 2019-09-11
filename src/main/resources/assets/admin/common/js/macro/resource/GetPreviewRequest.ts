import {ContentPath} from '../../content/ContentPath';
import {PropertyTree} from '../../data/PropertyTree';
import {MacroKey} from '../MacroKey';
import {Path} from '../../rest/Path';
import {JsonResponse} from '../../rest/JsonResponse';
import {PreviewRequest} from './PreviewRequest';
import {MacroPreviewJson} from './MacroPreviewJson';
import {MacroPreview} from '../MacroPreview';

export class GetPreviewRequest
    extends PreviewRequest<MacroPreviewJson, MacroPreview> {

    protected path: ContentPath;

    constructor(data: PropertyTree, macroKey: MacroKey, path: ContentPath) {
        super(data, macroKey);
        this.path = path;
    }

    getParams(): Object {
        return {
            form: this.data.toJson(),
            contentPath: !!this.path ? this.path.toString() : '',
            macroKey: this.macroKey.getRefString()
        };
    }

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath(), 'preview');
    }

    sendAndParse(): Q.Promise<MacroPreview> {
        return this.send().then((response: JsonResponse<MacroPreviewJson>) => {
            return MacroPreview.create().fromJson(response.getResult()).build();
        });
    }
}
