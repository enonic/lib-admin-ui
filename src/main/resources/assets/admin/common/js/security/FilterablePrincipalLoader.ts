import {PrincipalLoader} from './PrincipalLoader';
import {PrincipalType} from './PrincipalType';
import {Principal} from './Principal';
import {PrincipalKey} from './PrincipalKey';


interface PrincipalPattern {
    type?: PrincipalType;
    id: string;
}

export class FilterablePrincipalLoader extends PrincipalLoader {

    private forbiddenPrincipalPatterns: PrincipalPattern[] = [];

    private static PROJECT_ROLE_PREFIX: string = 'com.enonic.cms';

    private static defaultForbiddenPrincipalPattern: PrincipalPattern = {
        type: PrincipalType.ROLE,
        id: `^${FilterablePrincipalLoader.PROJECT_ROLE_PREFIX}`
    };

    constructor() {
        super();

        this.forbiddenPrincipalPatterns.push(FilterablePrincipalLoader.defaultForbiddenPrincipalPattern);
    }

    addForbiddenPattern(forbiddenPrincipalPattern: PrincipalPattern): FilterablePrincipalLoader {
        this.forbiddenPrincipalPatterns.push(forbiddenPrincipalPattern);

        return this;
    }

    protected isAllowedPrincipal(principal: Principal): boolean {
        return super.isAllowedPrincipal(principal) && !this.matchesForbiddenPattern(principal.getKey());
    }

    private matchesForbiddenPattern(principalKey: PrincipalKey): boolean {
        return this.forbiddenPrincipalPatterns.some((principalPattern: PrincipalPattern) =>
            (!principalPattern.type || principalPattern.type === principalKey.getType()) && principalKey.getId().match(principalPattern.id)
        );
    }
}
