import {PropertyTree} from '../../data/PropertyTree';
import {MacroKey} from '../MacroKey';
import {MacroResourceRequest} from './MacroResourceRequest';

export class PreviewRequest<JSON_TYPE, PARSED_TYPE>
    extends MacroResourceRequest<JSON_TYPE, PARSED_TYPE> {

    protected data: PropertyTree;

    protected macroKey: MacroKey;

    constructor(data: PropertyTree, macroKey: MacroKey) {
        super();
        super.setMethod('POST');
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
