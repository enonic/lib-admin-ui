import {NamesAndIconViewer} from '../ui/NamesAndIconViewer';
import {MacroDescriptor} from './MacroDescriptor';

export class MacroViewer
    extends NamesAndIconViewer<MacroDescriptor> {

    constructor() {
        super();
    }

    resolveDisplayName(object: MacroDescriptor): string {
        return object.getDisplayName();
    }

    resolveSubName(object: MacroDescriptor): string {
        return object.getDescription();
    }

    resolveIconUrl(object: MacroDescriptor): string {
        return object.getIconUrl();
    }
}
