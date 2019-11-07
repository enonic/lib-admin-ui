import {PrincipalKey} from './PrincipalKey';

export class RoleKeys {

    private static ROLE_ADMIN: string = 'system.admin';
    public static ADMIN: PrincipalKey = PrincipalKey.ofRole(RoleKeys.ROLE_ADMIN);
    private static ROLE_CMS_ADMIN: string = 'cms.admin';
    public static CMS_ADMIN: PrincipalKey = PrincipalKey.ofRole(RoleKeys.ROLE_CMS_ADMIN);
    private static ROLE_USER_ADMIN: string = 'system.user.admin';
    public static USER_ADMIN: PrincipalKey = PrincipalKey.ofRole(RoleKeys.ROLE_USER_ADMIN);

    /* */
    private static ROLE_EVERYONE: string = 'system.everyone';
    public static EVERYONE: PrincipalKey = PrincipalKey.ofRole(RoleKeys.ROLE_EVERYONE);
    private static ROLE_AUTHENTICATED: string = 'system.authenticated';
    public static AUTHENTICATED: PrincipalKey = PrincipalKey.ofRole(RoleKeys.ROLE_AUTHENTICATED);
    private static ROLE_CMS_EXPERT: string = 'cms.expert';
    public static CMS_EXPERT: PrincipalKey = PrincipalKey.ofRole(RoleKeys.ROLE_CMS_EXPERT);

    /* */

    private static contentAdminRoles: string[] = [RoleKeys.ROLE_ADMIN, RoleKeys.ROLE_CMS_ADMIN];

    private static userAdminRoles: string[] = [RoleKeys.ROLE_ADMIN, RoleKeys.ROLE_USER_ADMIN];

    private static contentExpertRoles: string[] = [RoleKeys.ROLE_ADMIN, RoleKeys.ROLE_CMS_ADMIN, RoleKeys.ROLE_CMS_EXPERT];

    /* */

    public static isContentAdmin(principalKey: PrincipalKey): boolean {
        return !!principalKey && RoleKeys.contentAdminRoles.some(roleId => principalKey.getId() === roleId);
    }

    public static isUserAdmin(principalKey: PrincipalKey): boolean {
        return !!principalKey && RoleKeys.userAdminRoles.some(roleId => principalKey.getId() === roleId);
    }

    public static isContentExpert(principalKey: PrincipalKey): boolean {
        return !!principalKey && RoleKeys.contentExpertRoles.some(roleId => principalKey.getId() === roleId);
    }

    public static isAdmin(principalKey: PrincipalKey): boolean {
        return !!principalKey && RoleKeys.ROLE_ADMIN === principalKey.getId();
    }

    public static isEveryone(principalKey: PrincipalKey): boolean {
        return !!principalKey && RoleKeys.ROLE_EVERYONE === principalKey.getId();
    }
}
