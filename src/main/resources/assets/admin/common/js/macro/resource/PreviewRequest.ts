import {PropertyTree} from '../../data/PropertyTree';
import {MacroKey} from '../MacroKey';
import {MacroResourceRequest} from './MacroResourceRequest';
import {HttpMethod} from '../../rest/HttpMethod';

export class PreviewRequest<PARSED_TYPE>
    extends MacroResourceRequest<PARSED_TYPE> {

    protected data: PropertyTree;

    protected macroKey: MacroKey;

    constructor(data: PropertyTree, macroKey: MacroKey) {
        super();
        this.setMethod(HttpMethod.POST);
        this.data = data;
        this.macroKey = macroKey;
    }

    getParams(): Object {
        return {
            form: this.data.toJson(),
            macroKey: this.macroKey.getRefString()
        };
    }
}
