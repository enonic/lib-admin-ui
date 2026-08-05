import {MouseSensor, type MouseSensorOptions, type TouchSensorOptions} from '@dnd-kit/core';

export const MOUSE_SENSOR_OPTIONS: MouseSensorOptions = {
    activationConstraint: {distance: 5},
};

export const HANDLE_TOUCH_SENSOR_OPTIONS: TouchSensorOptions = {
    activationConstraint: {distance: 5},
};

export const FULL_ROW_TOUCH_SENSOR_OPTIONS: TouchSensorOptions = {
    activationConstraint: {delay: 200, tolerance: 5},
};

export class PrimaryButtonMouseSensor extends MouseSensor {
    static activators: typeof MouseSensor.activators = [
        {
            eventName: 'onMouseDown' as const,
            handler: (syntheticEvent, {onActivation}): boolean => {
                const event = (syntheticEvent as unknown as {nativeEvent: MouseEvent}).nativeEvent;

                if (event.button !== 0) {
                    return false;
                }

                onActivation?.({event});
                return true;
            },
        },
    ];
}
