export class TreeGridSelection {

    private selectedItems: string[] = [];

    private selectionChanged: boolean = false;

    add(id: string) {
        if (this.selectedItems.indexOf(id) < 0) {
            this.selectedItems.push(id);
            this.selectionChanged = true;
        }
    }

    remove(id: string) {
        const totalSelected: number = this.selectedItems.length;

        this.selectedItems = this.selectedItems.filter((itemId: string) => itemId !== id);

        this.selectionChanged = totalSelected !== this.selectedItems.length;
    }

    reset() {
        if (this.selectedItems.length > 0) {
            this.selectionChanged = true;
        }

        this.selectedItems = [];
    }

    resetSelectionChanged() {
        this.selectionChanged = false;
    }

    isSelectionChanged(): boolean {
        return this.selectionChanged;
    }

    total(): number {
        return this.selectedItems.length;
    }

    getFirstItem(): string {
        return this.selectedItems[0];
    }

    getLastItem(): string {
        return this.selectedItems[this.selectedItems.length - 1];
    }

    hasSelectedItems(): boolean {
        return this.selectedItems.length > 0;
    }

    isEmpty(): boolean {
        return this.selectedItems.length === 0;
    }

    contains(id: string): boolean {
        return this.selectedItems.indexOf(id) >= 0;
    }

    getItems(): string[] {
        return this.selectedItems.slice();
    }
}
