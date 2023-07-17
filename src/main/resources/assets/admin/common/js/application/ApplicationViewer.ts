import {ApplicationUploadMock, Application} from './Application';
import {NamesAndIconViewer} from '../ui/NamesAndIconViewer';

export class ApplicationViewer
    extends NamesAndIconViewer<Application> {

    constructor() {
        super('application-viewer');
    }

    doLayout(object: Application | ApplicationUploadMock) {
        super.doLayout(object as Application);
        if (object && object.isLocal()) {
            this.getNamesAndIconView().setIconToolTip('Local application');
        }

        if (object && object instanceof Application && object.getIconUrl()) {
            this.getNamesAndIconView().setIconUrl(object.getIconUrl());
        }
    }

    resolveDisplayName(object: Application): string {
        this.toggleClass('local', object.isLocal());
        return object.getDisplayName();
    }

    resolveSubName(object: Application | ApplicationUploadMock): string {
        if (object instanceof Application && object.getDescription()) {
            return object.getDescription();
        }

        return object.getName();
    }

    resolveIconClass(): string {
        return 'icon-puzzle icon-large';
    }
}
