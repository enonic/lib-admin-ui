export class GridSelectionHelper {

    private selected: number[];

    constructor(selected: number[]) {
        this.selected = selected;
    }

    getSelected(): number[] {
        return this.selected;
    }

    addSelectedUp(): GridSelectionHelper {
        const lastSelectedRow: number = this.selected[this.selected.length - 1];
        const nextRowUp: number = lastSelectedRow - 1;

        if (nextRowUp < 0) {
            return this;
        }

        if (!this.isSelected(nextRowUp)) {
            this.selected.push(nextRowUp);
            return this;
        }

        const nextRowDown: number = lastSelectedRow + 1;

        if (!this.isSelected(nextRowDown)) {
            this.selected.pop();
            return this;
        }

        const nextNonSelectedRowUp: number = this.findFirstNotSelectedRowAbove(nextRowUp);

        if (nextNonSelectedRowUp >= 0) {
            this.selected.push(nextNonSelectedRowUp);
        }

        return this;
    }

    private isSelected(row: number): boolean {
        return this.selected.some((item: number) => item === row);
    }

    private moveSelectedRowToBeLastSelected(row: number) {
        this.selected.splice(this.selected.indexOf(row), 1);
        this.selected.push(row);
    }

    private findFirstNotSelectedRowAbove(row: number): number {
        this.moveSelectedRowToBeLastSelected(row);

        let nextNonSelectedRowAbove: number = row - 1;

        while (nextNonSelectedRowAbove >= 0) {
            if (!this.isSelected(nextNonSelectedRowAbove)) {
                break;
            }

            this.moveSelectedRowToBeLastSelected(nextNonSelectedRowAbove);

            nextNonSelectedRowAbove--;
        }

        return nextNonSelectedRowAbove;
    }

    addSelectedDown(totalItems: number): GridSelectionHelper {
        const lastSelectedRow: number = this.selected[this.selected.length - 1];
        const nextRowDown: number = lastSelectedRow + 1;

        if (nextRowDown >= totalItems) {
            return this;
        }

        if (!this.isSelected(nextRowDown)) {
            this.selected.push(nextRowDown);
            return this;
        }

        const nextRowUp: number = lastSelectedRow - 1;

        if (!this.isSelected(nextRowUp)) {
            this.selected.pop();
            return this;
        }

        const nextNonSelectedRowDown: number = this.findFirstNotSelectedRowUnder(nextRowDown, totalItems);

        if (nextNonSelectedRowDown < totalItems) {
            this.selected.push(nextNonSelectedRowDown);
        }

        return this;
    }

    private findFirstNotSelectedRowUnder(row: number, totalItems: number): number {
        this.moveSelectedRowToBeLastSelected(row);

        let nextNonSelectedRowDown: number = row + 1;

        while (nextNonSelectedRowDown < totalItems) {
            if (!this.isSelected(nextNonSelectedRowDown)) {
                break;
            }

            this.moveSelectedRowToBeLastSelected(row);

            nextNonSelectedRowDown++;
        }

        return nextNonSelectedRowDown;
    }
}
