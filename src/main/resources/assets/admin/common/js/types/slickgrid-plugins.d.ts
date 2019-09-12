/*
import {Grid} from '../ui/grid/Grid';

declare global {
    namespace SlickPlugin {
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
}
*/

declare namespace Slick {
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
