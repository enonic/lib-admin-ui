/**
 * Pure drop-target projection for tree-shaped sortable lists.
 *
 * The list renders flat (depth-first) but items live inside containers, so a drag
 * must resolve to a `{container, index}` target. This walks the tree's valid
 * insertion slots: at the drag gap it builds the stack of candidate slots from
 * deepest (entering the region above / after the nearest item) to shallowest
 * (climbing out past the owning layouts), and the drag direction picks within the
 * stack — dragging up enters the deeper slot, dragging down steps out to the
 * shallower one. The horizontal axis stays locked; level comes from the neighbours
 * plus travel direction, so a small up/down nudge moves between levels.
 */

export type DropNodeKind = 'container' | 'item';

export type DropNode = {
    /** Stable id, unique within the list. */
    id: string;
    /** Parent row id; null for the root row. */
    parentId: string | null;
    /** Visual indent level (1-based; matches the flattened tree level). */
    depth: number;
    /** `container` rows hold ordered `item` children; `item` rows are draggable. */
    kind: DropNodeKind;
};

export type DropDirection = 'up' | 'down';

export type ProjectTreeDropParams = {
    /** Visible rows in display order, including the dragged row. */
    nodes: DropNode[];
    /** Id of the dragged item row. */
    activeId: string;
    /** Id of the row currently under the pointer (may equal `activeId` at the list edge). */
    overId: string;
    /** Pointer position relative to the over row's vertical midpoint. */
    side: 'above' | 'below';
    /** Net travel direction; picks the deeper (up) or shallower (down) slot in a stack. */
    direction: DropDirection;
    /** Optional guard; when it returns false the projection is flagged not allowed. */
    isContainerAllowed?: (containerId: string, activeId: string) => boolean;
};

export type DropProjection = {
    /** Target container the dragged item lands in. */
    containerId: string;
    /** Insertion index within the target container (source already excluded). */
    index: number;
    /** Resulting item depth (`container.depth + 1`); drives the drop indicator indent. */
    depth: number;
    /** False when `isContainerAllowed` rejects the target. */
    allowed: boolean;
};

type Slot = {
    containerId: string;
    index: number;
    depth: number;
};

export function projectTreeDrop(params: ProjectTreeDropParams): DropProjection | null {
    const {nodes, activeId, direction, isContainerAllowed} = params;

    const byId = new Map<string, DropNode>();
    for (const node of nodes) byId.set(node.id, node);

    const active = byId.get(activeId);
    if (active == null) return null;

    // Indices/neighbours are computed with the dragged subtree removed, so the result
    // reflects the post-removal list (matching the move semantics).
    const visible = excludeSubtree(nodes, active);

    const gap = resolveGap(params, nodes, visible, active);
    if (gap == null) return null;

    const stack = buildSlotStack(gap.before, gap.after, gap.flatIndex, visible, byId);
    if (stack.length === 0) return null;

    const chosen = direction === 'up' ? stack[0] : stack[stack.length - 1];
    const allowed = isContainerAllowed?.(chosen.containerId, activeId) ?? true;

    return {containerId: chosen.containerId, index: chosen.index, depth: chosen.depth, allowed};
}

type Gap = {
    before: DropNode | undefined;
    after: DropNode | undefined;
    /** Insertion position within `visible` (number of visible rows above the gap). */
    flatIndex: number;
};

function resolveGap(
    params: ProjectTreeDropParams,
    nodes: DropNode[],
    visible: DropNode[],
    active: DropNode,
): Gap | null {
    const {activeId, overId, side} = params;

    // Hovering own slot (typically the list edge): anchor on the dragged item's own
    // neighbours so a down-drag can step out below the last row.
    if (overId === activeId) {
        const activeFullIndex = nodes.findIndex(node => node.id === activeId);
        if (activeFullIndex <= 0) return null;
        const before = nodes[activeFullIndex - 1];
        let end = activeFullIndex + 1;
        while (end < nodes.length && nodes[end].depth > active.depth) end++;
        const after = nodes[end];
        const beforeVisibleIndex = visible.findIndex(node => node.id === before.id);
        if (beforeVisibleIndex === -1) return null;
        return {before, after, flatIndex: beforeVisibleIndex + 1};
    }

    const overIndex = visible.findIndex(node => node.id === overId);
    if (overIndex === -1) return null;

    if (side === 'below') {
        return {before: visible[overIndex], after: visible[overIndex + 1], flatIndex: overIndex + 1};
    }
    return {before: visible[overIndex - 1], after: visible[overIndex], flatIndex: overIndex};
}

function buildSlotStack(
    before: DropNode | undefined,
    after: DropNode | undefined,
    flatIndex: number,
    visible: DropNode[],
    byId: Map<string, DropNode>,
): Slot[] {
    if (before == null) return [];

    const region = before.kind === 'container' ? before : byId.get(before.parentId ?? '');
    if (region == null || region.kind !== 'container') return [];

    const stack: Slot[] = [];

    // Entering the region directly below the gap, when it opens right under its layout.
    if (after != null && after.kind === 'container' && after.parentId === before.id) {
        stack.push({containerId: after.id, index: 0, depth: after.depth + 1});
    }

    // Deepest item slot: inside `before` (a region header) or right after `before` (an item).
    stack.push({
        containerId: region.id,
        index: countItemsBefore(visible, region.id, flatIndex),
        depth: region.depth + 1,
    });

    // Climb out region by region, after each owning layout, down to the next row's level.
    let current = region;
    while (true) {
        const owner = byId.get(current.parentId ?? '');
        if (owner == null || owner.parentId == null) break;
        const parentRegion = byId.get(owner.parentId);
        if (parentRegion == null || parentRegion.kind !== 'container') break;
        stack.push({
            containerId: parentRegion.id,
            index: countItemsBefore(visible, parentRegion.id, flatIndex),
            depth: parentRegion.depth + 1,
        });
        current = parentRegion;
    }

    // A region header or item below the gap pins how shallow the drop may climb.
    const minRegionDepth = after == null ? 1 : after.kind === 'item' ? after.depth - 1 : after.depth;
    const filtered = stack.filter(slot => slot.depth - 1 >= minRegionDepth);
    return filtered.length > 0 ? filtered : [stack[0]];
}

function excludeSubtree(nodes: DropNode[], active: DropNode): DropNode[] {
    const activeIndex = nodes.findIndex(node => node.id === active.id);
    if (activeIndex === -1) return nodes;

    let end = activeIndex + 1;
    while (end < nodes.length && nodes[end].depth > active.depth) {
        end++;
    }
    return [...nodes.slice(0, activeIndex), ...nodes.slice(end)];
}

function countItemsBefore(visible: DropNode[], regionId: string, flatIndex: number): number {
    let count = 0;
    const limit = Math.min(flatIndex, visible.length);
    for (let i = 0; i < limit; i++) {
        const node = visible[i];
        if (node.kind === 'item' && node.parentId === regionId) count++;
    }
    return count;
}
