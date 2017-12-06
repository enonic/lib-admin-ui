module api.ui.security.acl {
    import UserStoreAccessControlEntry = api.security.acl.UserStoreAccessControlEntry;

    export class UserStoreAccessControlListView extends api.ui.selector.list.ListBox<UserStoreAccessControlEntry> {

        private itemValueChangedListeners: {(item: UserStoreAccessControlEntry): void}[] = [];
        private itemsEditable: boolean = true;

        constructor(className?: string) {
            super('selected-options access-control-list' + (className ? ' ' + className : ''));
        }

        createItemView(entry: UserStoreAccessControlEntry, readOnly: boolean): UserStoreAccessControlEntryView {
            let itemView = new UserStoreAccessControlEntryView(entry, readOnly);
            itemView.onRemoveClicked(() => {
                this.removeItem(entry);
            });
            itemView.onValueChanged((item: UserStoreAccessControlEntry) => {
                this.notifyItemValueChanged(item);
            });

            return itemView;
        }

        getItemId(item: UserStoreAccessControlEntry): string {
            return item.getPrincipal().getKey().toString();
        }

        onItemValueChanged(listener: (item: UserStoreAccessControlEntry) => void) {
            this.itemValueChangedListeners.push(listener);
        }

        unItemValueChanged(listener: (item: UserStoreAccessControlEntry) => void) {
            this.itemValueChangedListeners = this.itemValueChangedListeners.filter((curr) => {
                return curr !== listener;
            });
        }

        notifyItemValueChanged(item: UserStoreAccessControlEntry) {
            this.itemValueChangedListeners.forEach((listener) => {
                listener(item);
            });
        }

        setItemsEditable(editable: boolean): UserStoreAccessControlListView {
            if (this.itemsEditable !== editable) {
                this.itemsEditable = editable;
                this.refreshList();
            }
            return this;
        }

        isItemsEditable(): boolean {
            return this.itemsEditable;
        }

    }

}
