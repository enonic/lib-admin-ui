import * as Q from 'q';
import {PropertyTree} from '../../data/PropertyTree';
import {MacroKey} from '../MacroKey';
import {Path} from '../../rest/Path';
import {JsonResponse} from '../../rest/JsonResponse';
import {PreviewRequest} from './PreviewRequest';
import {MacroPreviewStringJson} from './MacroPreviewJson';

export class GetPreviewStringRequest
    extends PreviewRequest<MacroPreviewStringJson, string> {

    constructor(data: PropertyTree, macroKey: MacroKey) {
        super(data, macroKey);
    }

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath(), 'previewString');
    }

    sendAndParse(): Q.Promise<string> {
        return this.send().then((response: JsonResponse<MacroPreviewStringJson>) => {
            return response.getResult().macro;
        });
    }
}
