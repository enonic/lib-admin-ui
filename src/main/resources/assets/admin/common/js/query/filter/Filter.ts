import {FilterTypeWrapperJson} from './FilterTypeWrapperJson';
import {ClassHelper} from '../../ClassHelper';

export class Filter {

    public toJson(): FilterTypeWrapperJson {
        throw new Error('Must be implemented by inheritor: ' + ClassHelper.getClassName(this));
    }

}
