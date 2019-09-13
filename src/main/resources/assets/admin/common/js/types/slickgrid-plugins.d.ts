declare namespace Slick {
    export class RowSelectionModel<T>
        extends Slick.SelectionModel<T, any> {
        constructor(options: any);
    }

    export class RowMoveManager<T extends Slick.SlickData> {

        onBeforeMoveRows: Slick.Event<OnMoveRowsEventData>;

        onMoveRows: Slick.Event<OnMoveRowsEventData>;

        constructor(options: any);

        public init(grid: Slick.Grid<T>): void;

        public destroy(): void;

    }

    export interface OnMoveRowsEventData {

    }
}
