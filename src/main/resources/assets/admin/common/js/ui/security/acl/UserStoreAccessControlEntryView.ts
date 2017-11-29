module api.ui.security.acl {

    import Principal = api.security.Principal;
    import UserStoreAccessControlEntry = api.security.acl.UserStoreAccessControlEntry;
    import UserStoreAccess = api.security.acl.UserStoreAccess;

    export class UserStoreAccessControlEntryView extends api.ui.security.PrincipalViewer {

        private ace: UserStoreAccessControlEntry;

        private accessSelector: UserStoreAccessSelector;

        private valueChangedListeners: {(item: UserStoreAccessControlEntry): void}[] = [];

        public static debug: boolean = false;

        constructor(ace: UserStoreAccessControlEntry, readonly: boolean = false) {
            super('selected-option userstore-access-control-entry');

            this.ace = ace;
            this.setEditable(!readonly);

            if (isNaN(this.ace.getAccess())) {
                this.ace.setAccess(UserStoreAccess[UserStoreAccess.CREATE_USERS]);
            }

            this.setUserStoreAccessControlEntry(this.ace);

        }

        getValueChangedListeners(): {(item: UserStoreAccessControlEntry): void}[] {
            return this.valueChangedListeners;
        }

        setEditable(editable: boolean) {
            super.setEditable(editable);

            this.toggleClass('readonly', !editable);
            if (this.accessSelector) {
                this.accessSelector.setEnabled(editable);
            }
        }

        onValueChanged(listener: (item: UserStoreAccessControlEntry) => void) {
            this.valueChangedListeners.push(listener);
        }

        unValueChanged(listener: (item: UserStoreAccessControlEntry) => void) {
            this.valueChangedListeners = this.valueChangedListeners.filter((curr) => {
                return curr !== listener;
            });
        }

        notifyValueChanged(item: UserStoreAccessControlEntry) {
            this.valueChangedListeners.forEach((listener) => {
                listener(item);
            });
        }

        public setUserStoreAccessControlEntry(ace: UserStoreAccessControlEntry) {
            this.ace = ace;

            let principal: Principal = <Principal>Principal.create().setKey(ace.getPrincipal().getKey()).setModifiedTime(
                ace.getPrincipal().getModifiedTime()).setDisplayName(
                ace.getPrincipal().getDisplayName()).build();
            this.setObject(principal);

            this.doLayout(principal);
        }

        public getUserStoreAccessControlEntry(): UserStoreAccessControlEntry {
            let ace = new UserStoreAccessControlEntry(this.ace.getPrincipal(), this.ace.getAccess());
            return ace;
        }

        doLayout(object: Principal) {
            super.doLayout(object);

            if (UserStoreAccessControlEntryView.debug) {
                console.debug('UserStoreAccessControlEntryView.doLayout');
            }

            // permissions will be set on access selector value change

            if (!this.accessSelector) {
                this.accessSelector = new UserStoreAccessSelector();
                this.accessSelector.setEnabled(this.isEditable());
                this.accessSelector.onValueChanged((event: ValueChangedEvent) => {
                    this.ace.setAccess(event.getNewValue());
                });
                this.appendChild(this.accessSelector);
            }
            this.accessSelector.setValue(this.ace.getAccess(), true);

            this.appendRemoveButton();
        }
    }

}
