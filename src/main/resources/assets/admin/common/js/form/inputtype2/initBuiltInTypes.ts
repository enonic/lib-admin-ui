import {initBuiltInDescriptors} from '../inputtype/descriptor/initBuiltInDescriptors';
import {initBuiltInComponents} from './initBuiltInComponents';

export function initBuiltInTypes(): void {
    initBuiltInDescriptors();
    initBuiltInComponents();
}
