import * as Q from 'q';
import {ApplicationKey} from '../../application/ApplicationKey';
import {Path} from '../../rest/Path';
import {JsonResponse} from '../../rest/JsonResponse';
import {MacroResourceRequest} from './MacroResourceRequest';
import {MacrosJson} from './MacrosJson';
import {MacroDescriptor} from '../MacroDescriptor';
import {HttpMethod} from '../../rest/HttpMethod';

export class GetMacrosRequest
    extends MacroResourceRequest<MacrosJson, MacroDescriptor[]> {

    private applicationKeys: ApplicationKey[];

    constructor() {
        super();
        this.setMethod(HttpMethod.POST);
    }

    setApplicationKeys(applicationKeys: ApplicationKey[]) {
        this.applicationKeys = applicationKeys;
    }

    getParams(): Object {
        return {
            appKeys: ApplicationKey.toStringArray(this.applicationKeys)
        };
    }

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath(), 'getByApps');
    }

    sendAndParse(): Q.Promise<MacroDescriptor[]> {
        return this.send().then((response: JsonResponse<MacrosJson>) => {
            return this.toMacroDescriptors(response.getResult());
        });
    }

    toMacroDescriptors(macrosJson: MacrosJson): MacroDescriptor[] {
        let result: MacroDescriptor[] = [];
        for (let i = 0; i < macrosJson.macros.length; i++) {
            result.push(MacroDescriptor.fromJson(macrosJson.macros[i]));
        }
        return result;
    }
}
