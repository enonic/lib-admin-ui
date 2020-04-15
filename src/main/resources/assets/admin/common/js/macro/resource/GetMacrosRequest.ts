import {ApplicationKey} from '../../application/ApplicationKey';
import {JsonResponse} from '../../rest/JsonResponse';
import {MacroResourceRequest} from './MacroResourceRequest';
import {MacrosJson} from './MacrosJson';
import {MacroDescriptor} from '../MacroDescriptor';
import {HttpMethod} from '../../rest/HttpMethod';

export class GetMacrosRequest
    extends MacroResourceRequest<MacroDescriptor[]> {

    private applicationKeys: ApplicationKey[];

    constructor() {
        super();
        this.setMethod(HttpMethod.POST);
        this.addRequestPathElements('getByApps');
    }

    setApplicationKeys(applicationKeys: ApplicationKey[]) {
        this.applicationKeys = applicationKeys;
    }

    getParams(): Object {
        return {
            appKeys: ApplicationKey.toStringArray(this.applicationKeys)
        };
    }

    private toMacroDescriptors(macrosJson: MacrosJson): MacroDescriptor[] {
        const result: MacroDescriptor[] = [];

        for (let i = 0; i < macrosJson.macros.length; i++) {
            result.push(MacroDescriptor.fromJson(macrosJson.macros[i]));
        }

        return result;
    }

    protected parseResponse(response: JsonResponse<MacrosJson>): MacroDescriptor[] {
        return this.toMacroDescriptors(response.getResult());
    }
}
