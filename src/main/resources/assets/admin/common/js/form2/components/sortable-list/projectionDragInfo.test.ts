import {describe, expect, it} from 'vitest';
import {getProjectionDragInfo, getProjectionPlaceholderIndex} from './projectionDragInfo';

describe('getProjectionDragInfo', () => {
    it('reports above when the dragged row midpoint is above the hovered row midpoint', () => {
        expect(
            getProjectionDragInfo({
                activeIndex: 1,
                overIndex: 2,
                deltaY: 20,
                activeTranslatedRect: {top: 10, height: 20},
                activeInitialRect: {top: -10, height: 20},
                overRect: {top: 40, height: 20},
            }),
        ).toEqual({activeIndex: 1, overIndex: 2, side: 'above', direction: 'down'});
    });

    it('reports below when the dragged row midpoint is below the hovered row midpoint', () => {
        expect(
            getProjectionDragInfo({
                activeIndex: 2,
                overIndex: 1,
                deltaY: -20,
                activeTranslatedRect: {top: 60, height: 20},
                activeInitialRect: {top: 80, height: 20},
                overRect: {top: 40, height: 20},
            }),
        ).toEqual({activeIndex: 2, overIndex: 1, side: 'below', direction: 'up'});
    });
});

describe('getProjectionPlaceholderIndex', () => {
    it.each([
        {activeIndex: 2, overIndex: 0, side: 'above' as const, expected: 0},
        {activeIndex: 2, overIndex: 0, side: 'below' as const, expected: 1},
        {activeIndex: 0, overIndex: 2, side: 'above' as const, expected: 1},
        {activeIndex: 0, overIndex: 2, side: 'below' as const, expected: 2},
    ])('returns $expected when moving from $activeIndex to $side $overIndex', ({expected, ...info}) => {
        const direction = info.activeIndex < info.overIndex ? 'down' : 'up';
        expect(getProjectionPlaceholderIndex({...info, direction}, 3)).toBe(expected);
    });
});
