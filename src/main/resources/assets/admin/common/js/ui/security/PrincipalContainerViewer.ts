import {PrincipalType} from '../../security/PrincipalType';
import {NamesAndIconViewer} from '../NamesAndIconViewer';
import {PrincipalContainer} from './PrincipalContainer';

export class PrincipalContainerViewer<T extends PrincipalContainer>
    extends NamesAndIconViewer<T> {

    constructor() {
        super();
    }

    resolveDisplayName(object: T): string {
        return object.getPrincipalDisplayName();
    }

    resolveUnnamedDisplayName(object: T): string {
        return object.getPrincipalTypeName();
    }

    resolveSubName(object: T): string {
        return object.getPrincipalKey().toPath();
    }

    resolveIconClass(object: T): string {
        switch (object.getPrincipalKey().getType()) {
        case PrincipalType.USER:
            return 'icon-user';
        case PrincipalType.GROUP:
            return 'icon-users';
        case PrincipalType.ROLE:
            return 'icon-masks';
        }

        return '';
    }
}
