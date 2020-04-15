import {PropertyTree} from '../../data/PropertyTree';
import {MacroKey} from '../MacroKey';
import {JsonResponse} from '../../rest/JsonResponse';
import {PreviewRequest} from './PreviewRequest';
import {MacroPreviewStringJson} from './MacroPreviewJson';

export class GetPreviewStringRequest
    extends PreviewRequest<string> {

    constructor(data: PropertyTree, macroKey: MacroKey) {
        super(data, macroKey);
        this.addRequestPathElements('previewString');
    }

    protected parseResponse(response: JsonResponse<MacroPreviewStringJson>): string {
        return response.getResult().macro;
    }
}
