module api.ui.security {

    import Principal = api.security.Principal;
    import PrincipalType = api.security.PrincipalType;

    export class PrincipalViewer
        extends api.ui.NamesAndIconViewer<Principal> {

        constructor(className?: string) {
            super(className);
        }

        resolveDisplayName(object: Principal): string {
            return object.getDisplayName();
        }

        resolveUnnamedDisplayName(object: Principal): string {
            return object.getTypeName();
        }

        resolveSubName(object: Principal): string {
            return object.getKey().toPath();
        }

        resolveIconClass(object: Principal): string {
            switch (object.getKey().getType()) {
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

    export class PrincipalViewerCompact
        extends api.ui.Viewer<Principal> {

        private currentUser: Principal;

        constructor() {
            super('principal-viewer-compact');
        }

        doLayout(principal: Principal) {
            super.doLayout(principal);
            if (!principal) {
                return;
            }

            let displayName = principal.getDisplayName().split(' ').map(word => word.substring(0, 1).toUpperCase());

            let icon = new api.dom.SpanEl('user-icon').setHtml(displayName.length >= 2
                                                               ? displayName.join('').substring(0, 2)
                                                               : principal.getDisplayName().substring(0, 2).toUpperCase());

            if (this.currentUser && this.currentUser.getKey().equals(principal.getKey())) {
                icon.addClass('active');
            }

            new Tooltip(icon, principal.getDisplayName(), 200).setMode(Tooltip.MODE_GLOBAL_STATIC);

            this.appendChild(icon);
        }

        setCurrentUser(user: Principal) {
            this.currentUser = user;
        }
    }

}
