import {describe, expect, it} from 'vitest';
import {type DropNode, projectTreeDrop} from './treeProjection';

//
// * Fixtures
//

function node(id: string, parentId: string | null, depth: number, kind: 'container' | 'item'): DropNode {
    return {id, parentId, depth, kind};
}

/**
 * Single region with `count` item children.
 *
 * /          page    depth 1
 * /r         region  depth 2
 * /r/0..n    item    depth 3
 */
function simpleRegion(count: number): DropNode[] {
    const nodes: DropNode[] = [node('/', null, 1, 'item'), node('/r', '/', 2, 'container')];
    for (let i = 0; i < count; i++) {
        nodes.push(node(`/r/${i}`, '/r', 3, 'item'));
    }
    return nodes;
}

/**
 * Page with a layout; the trailing item lives in MAIN (Footer last).
 *
 * [8] /main/2  is the dragged "Footer"; [7] /main/1/right is an empty region.
 */
function footerInMain(): DropNode[] {
    return [
        node('/', null, 1, 'item'),
        node('/main', '/', 2, 'container'),
        node('/main/0', '/main', 3, 'item'),
        node('/main/1', '/main', 3, 'item'),
        node('/main/1/left', '/main/1', 4, 'container'),
        node('/main/1/left/0', '/main/1/left', 5, 'item'),
        node('/main/1/left/1', '/main/1/left', 5, 'item'),
        node('/main/1/right', '/main/1', 4, 'container'),
        node('/main/2', '/main', 3, 'item'),
    ];
}

/**
 * Same tree after Footer has been dropped inside the empty right region, where it is
 * the only child and the last row overall.
 */
function footerInRight(): DropNode[] {
    return [
        node('/', null, 1, 'item'),
        node('/main', '/', 2, 'container'),
        node('/main/0', '/main', 3, 'item'),
        node('/main/1', '/main', 3, 'item'),
        node('/main/1/left', '/main/1', 4, 'container'),
        node('/main/1/left/0', '/main/1/left', 5, 'item'),
        node('/main/1/left/1', '/main/1/left', 5, 'item'),
        node('/main/1/right', '/main/1', 4, 'container'),
        node('/main/1/right/0', '/main/1/right', 5, 'item'),
    ];
}

/**
 * Layout with populated LEFT and MIDDLE regions followed by empty RIGHT. Footer is
 * directly below the layout and can be dragged across the RIGHT row boundary.
 */
function footerAfterThreeRegions(): DropNode[] {
    return [
        node('/', null, 1, 'item'),
        node('/main', '/', 2, 'container'),
        node('/main/0', '/main', 3, 'item'),
        node('/main/0/left', '/main/0', 4, 'container'),
        node('/main/0/left/0', '/main/0/left', 5, 'item'),
        node('/main/0/middle', '/main/0', 4, 'container'),
        node('/main/0/middle/0', '/main/0/middle', 5, 'item'),
        node('/main/0/right', '/main/0', 4, 'container'),
        node('/main/1', '/main', 3, 'item'),
    ];
}

/** Same layout at the end of MAIN, with the draggable item immediately before it. */
function footerBeforeThreeRegions(populateRight = false): DropNode[] {
    const nodes = [
        node('/', null, 1, 'item'),
        node('/main', '/', 2, 'container'),
        node('/main/0', '/main', 3, 'item'),
        node('/main/1', '/main', 3, 'item'),
        node('/main/1/left', '/main/1', 4, 'container'),
        node('/main/1/left/0', '/main/1/left', 5, 'item'),
        node('/main/1/middle', '/main/1', 4, 'container'),
        node('/main/1/middle/0', '/main/1/middle', 5, 'item'),
        node('/main/1/right', '/main/1', 4, 'container'),
    ];
    if (populateRight) nodes.push(node('/main/1/right/0', '/main/1/right', 5, 'item'));
    return nodes;
}

//
// * Reordering within a region (single slot — direction is irrelevant)
//

describe('projectTreeDrop — reorder within a region', () => {
    it('drops after the over item on the lower half', () => {
        const result = projectTreeDrop({
            nodes: simpleRegion(3),
            activeId: '/r/0',
            overId: '/r/2',
            side: 'below',
            direction: 'down',
        });
        expect(result).toEqual({containerId: '/r', index: 2, depth: 3, allowed: true});
    });

    it('drops before the over item on the upper half', () => {
        const result = projectTreeDrop({
            nodes: simpleRegion(3),
            activeId: '/r/0',
            overId: '/r/2',
            side: 'above',
            direction: 'up',
        });
        expect(result).toEqual({containerId: '/r', index: 1, depth: 3, allowed: true});
    });

    it('reaches the top slot from the first item', () => {
        const result = projectTreeDrop({
            nodes: simpleRegion(3),
            activeId: '/r/2',
            overId: '/r/0',
            side: 'above',
            direction: 'up',
        });
        expect(result).toEqual({containerId: '/r', index: 0, depth: 3, allowed: true});
    });
});

//
// * Explicit final targets and step-out behavior
//

describe('projectTreeDrop — final target / step out', () => {
    it('enters the empty region when dragging the trailing item up onto it', () => {
        const result = projectTreeDrop({
            nodes: footerInMain(),
            activeId: '/main/2',
            overId: '/main/1/right',
            side: 'below',
            direction: 'up',
        });
        expect(result).toEqual({containerId: '/main/1/right', index: 0, depth: 5, allowed: true});
    });

    it('enters the explicitly hovered empty region when dragging down onto it', () => {
        const result = projectTreeDrop({
            nodes: footerInMain(),
            activeId: '/main/2',
            overId: '/main/1/right',
            side: 'below',
            direction: 'down',
        });
        expect(result).toEqual({containerId: '/main/1/right', index: 0, depth: 5, allowed: true});
    });

    it('uses the preceding region when hovering above an empty container row', () => {
        const result = projectTreeDrop({
            nodes: footerAfterThreeRegions(),
            activeId: '/main/1',
            overId: '/main/0/right',
            side: 'above',
            direction: 'up',
        });
        expect(result).toEqual({containerId: '/main/0/middle', index: 1, depth: 5, allowed: true});
    });

    it('enters the empty container when hovering below its row midpoint', () => {
        const result = projectTreeDrop({
            nodes: footerAfterThreeRegions(),
            activeId: '/main/1',
            overId: '/main/0/right',
            side: 'below',
            direction: 'up',
        });
        expect(result).toEqual({containerId: '/main/0/right', index: 0, depth: 5, allowed: true});
    });

    it('drops after the final layout when moving past its empty final region', () => {
        const result = projectTreeDrop({
            nodes: footerBeforeThreeRegions(),
            activeId: '/main/0',
            overId: '/main/1/right',
            side: 'after',
            direction: 'down',
        });
        expect(result).toEqual({containerId: '/main', index: 1, depth: 3, allowed: true});
    });

    it('appends inside a populated final region from above', () => {
        const result = projectTreeDrop({
            nodes: footerBeforeThreeRegions(true),
            activeId: '/main/0',
            overId: '/main/1/right/0',
            side: 'below',
            direction: 'down',
        });
        expect(result).toEqual({containerId: '/main/1/right', index: 1, depth: 5, allowed: true});
    });

    it('drops after the final layout when moving past its populated final region', () => {
        const result = projectTreeDrop({
            nodes: footerBeforeThreeRegions(true),
            activeId: '/main/0',
            overId: '/main/1/right/0',
            side: 'after',
            direction: 'down',
        });
        expect(result).toEqual({containerId: '/main', index: 1, depth: 3, allowed: true});
    });

    it('steps out below the last row when the item is alone inside the trailing region', () => {
        // over === active: the item is the last row, so a down-drag steps it out a level.
        const result = projectTreeDrop({
            nodes: footerInRight(),
            activeId: '/main/1/right/0',
            overId: '/main/1/right/0',
            side: 'below',
            direction: 'down',
        });
        expect(result).toEqual({containerId: '/main', index: 2, depth: 3, allowed: true});
    });
});

//
// * Crossing into / out of a region by the hovered neighbour
//

describe('projectTreeDrop — hovered neighbour level', () => {
    it('nests into a region by hovering one of its items', () => {
        const result = projectTreeDrop({
            nodes: footerInMain(),
            activeId: '/main/0',
            overId: '/main/1/left/1',
            side: 'above',
            direction: 'up',
        });
        expect(result).toEqual({containerId: '/main/1/left', index: 1, depth: 5, allowed: true});
    });

    it('climbs out to the parent level by hovering a parent-level item', () => {
        const result = projectTreeDrop({
            nodes: footerInMain(),
            activeId: '/main/1/left/0',
            overId: '/main/2',
            side: 'above',
            direction: 'down',
        });
        expect(result).toEqual({containerId: '/main', index: 2, depth: 3, allowed: true});
    });
});

describe('projectTreeDrop — container row zones', () => {
    it('targets index 0 when hovering below a populated container row midpoint', () => {
        const result = projectTreeDrop({
            nodes: simpleRegion(3),
            activeId: '/r/2',
            overId: '/r',
            side: 'below',
            direction: 'down',
        });
        expect(result).toEqual({containerId: '/r', index: 0, depth: 3, allowed: true});
    });
});

//
// * Allowed predicate
//

describe('projectTreeDrop — allowed predicate', () => {
    it('flags the projection disallowed when the target container is rejected', () => {
        const result = projectTreeDrop({
            nodes: simpleRegion(3),
            activeId: '/r/0',
            overId: '/r/2',
            side: 'below',
            direction: 'down',
            isContainerAllowed: () => false,
        });
        expect(result).toEqual({containerId: '/r', index: 2, depth: 3, allowed: false});
    });

    it('flags an explicitly hovered empty container disallowed when rejected', () => {
        const result = projectTreeDrop({
            nodes: footerInMain(),
            activeId: '/main/2',
            overId: '/main/1/right',
            side: 'below',
            direction: 'down',
            isContainerAllowed: containerId => containerId !== '/main/1/right',
        });
        expect(result).toEqual({containerId: '/main/1/right', index: 0, depth: 5, allowed: false});
    });
});

//
// * Guards
//

describe('projectTreeDrop — guards', () => {
    it('returns null when the over row is missing', () => {
        expect(
            projectTreeDrop({
                nodes: simpleRegion(3),
                activeId: '/r/0',
                overId: '/nope',
                side: 'above',
                direction: 'up',
            }),
        ).toBeNull();
    });

    it('returns null at the top edge (nothing above the gap)', () => {
        expect(
            projectTreeDrop({nodes: simpleRegion(3), activeId: '/r/2', overId: '/', side: 'above', direction: 'up'}),
        ).toBeNull();
    });
});
