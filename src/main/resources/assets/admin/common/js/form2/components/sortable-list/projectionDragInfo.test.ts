import {describe, expect, it} from 'vitest';
import {getProjectionDragInfo} from './projectionDragInfo';

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
