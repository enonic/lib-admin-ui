/** Which side of the hovered row the dragged item lands on. */
export type SortableDropSide = 'above' | 'below';

/** Net vertical travel direction during a drag. */
export type SortableDragDirection = 'up' | 'down';

/** Live drag state surfaced in projection mode for resolving a tree-shaped drop. */
export type SortableDragInfo = {
    /** Index of the dragged item. */
    activeIndex: number;
    /** Index of the row currently under the pointer (equals `activeIndex` at the list edge). */
    overIndex: number;
    /** Side relative to the hovered row's vertical midpoint. */
    side: SortableDropSide;
    /** Net vertical travel from the drag start. */
    direction: SortableDragDirection;
};

type VerticalRect = {
    top: number;
    height: number;
};

export type ProjectionDragInfoParams = {
    activeIndex: number;
    overIndex: number;
    deltaY: number;
    activeTranslatedRect: VerticalRect | null;
    activeInitialRect: VerticalRect | null;
    overRect: VerticalRect | null;
};

function getMidpoint(rect: VerticalRect): number {
    return rect.top + rect.height / 2;
}

function getDraggedMidpoint(params: ProjectionDragInfoParams): number | null {
    if (params.activeTranslatedRect != null) return getMidpoint(params.activeTranslatedRect);
    if (params.activeInitialRect != null) return getMidpoint(params.activeInitialRect) + params.deltaY;
    return null;
}

function getDropSide(
    draggedMidpoint: number | null,
    overMidpoint: number | null,
    direction: SortableDragDirection,
): SortableDropSide {
    if (draggedMidpoint == null || overMidpoint == null) return direction === 'up' ? 'above' : 'below';
    return draggedMidpoint < overMidpoint ? 'above' : 'below';
}

export function getProjectionDragInfo(params: ProjectionDragInfoParams): SortableDragInfo {
    const direction: SortableDragDirection = params.deltaY < 0 ? 'up' : 'down';
    const draggedMidpoint = getDraggedMidpoint(params);
    const overMidpoint = params.overRect == null ? null : getMidpoint(params.overRect);

    return {
        activeIndex: params.activeIndex,
        overIndex: params.overIndex,
        side: getDropSide(draggedMidpoint, overMidpoint, direction),
        direction,
    };
}

/** Convert a midpoint-relative gap to verticalListSortingStrategy's original-array index. */
export function getProjectionPlaceholderIndex(info: SortableDragInfo, itemCount: number): number {
    // Crossing downward removes the active row above the gap; crossing upward leaves it below.
    const isMovingDown = info.activeIndex < info.overIndex;
    const index =
        info.side === 'above' ? info.overIndex - (isMovingDown ? 1 : 0) : info.overIndex + (isMovingDown ? 0 : 1);
    return Math.max(0, Math.min(index, itemCount - 1));
}
