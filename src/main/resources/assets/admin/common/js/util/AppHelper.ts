import * as $ from 'jquery';
import {Element} from '../dom/Element';
import {Body} from '../dom/Body';
import {WindowDOM} from '../dom/WindowDOM';

/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-this-alias, prefer-rest-params */

export class AppHelper {

    // Returns a function, that, as long as it continues to be invoked, will not
    // be triggered. The function will be called after it stops being called for
    // N milliseconds. If `immediate` is passed, trigger the function on the
    // leading edge, instead of the trailing.
    static debounce(func: Function, wait: number, immediate: boolean = false): (...args: any[]) => void {
        let timeout;
        return function (..._anyArgs: any[]) {
            // @ts-ignore
            const context = this;
            const args = arguments;
            const later = function () {
                timeout = null;
                if (!immediate) {
                    func.apply(context, args);
                }
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = window.setTimeout(later, wait);
            if (callNow) {
                func.apply(context, args);
            }
        };
    }

    static debounceWithInterrupt(func: Function, wait: number, immediate: boolean = false): (args: any[], interrupt?: boolean) => void {
        let timeout;
        return function (_anyArgs: any[], interrupt?: boolean) {
            // @ts-ignore
            const context = this;
            const args = _anyArgs;
            const later = function () {
                timeout = null;
                if (!immediate) {
                    func.apply(context, args);
                }
            };
            const callNow = (immediate && !timeout) || interrupt;
            clearTimeout(timeout);
            timeout = window.setTimeout(later, wait);
            if (callNow) {
                func.apply(context, args);
            }
        };
    }

    // Returns a function, that, will be invoked immediately. Then, as long
    // as it continues to be invoked, will not be triggered. The function
    // will be called after it stops being called for N milliseconds and it
    // was invoked at least once during that interval.
    static runOnceAndDebounce(func: Function, wait: number): (...args: any[]) => void {
        let timeout;
        let trailing = false;
        return function (..._anyArgs: any[]) {
            // @ts-ignore
            const context = this;
            const args = arguments;
            const later = function () {
                timeout = null;
                if (trailing) {
                    func.apply(context, args);
                }
                trailing = false;
            };
            const callNow = !trailing && !timeout;
            clearTimeout(timeout);
            timeout = window.setTimeout(later, wait);
            if (callNow) {
                func.apply(context, args);
            } else {
                trailing = true;
            }
        };
    }

    // Handles the result of the initialization, while the result is truthy
    static whileTruthy(initializer: () => any, callback: (value: any) => void): void {
        let result: any;

        for (result = initializer(); !!result; result = initializer()) {
            callback(result);
        }
    }

    static preventDragRedirect(message: String = '', element?: Element): void {
        element = element || Body.get();

        let window = WindowDOM.get();
        let timeout = null;

        let beforeUnloadHandler = (event) => {
            (event || window.asWindow().event)['returnValue'] = message;
            event.preventDefault();
            return message;
        };

        let unBeforeUnload = () => {
            timeout = null;
            window.unBeforeUnload(beforeUnloadHandler);
        };

        element.onDragOver(() => {
            if (!timeout) {
                window.onBeforeUnload(beforeUnloadHandler);
            }
            clearTimeout(timeout);
            timeout = setTimeout(unBeforeUnload, 100);
        });
    }

    static dispatchCustomEvent(name: string, element: Element): void {
        $(element.getHTMLElement()).trigger(name);
    }

    static focusInOut(element: Element, onFocusOut: (target: HTMLElement) => void, wait: number = 50,
                      preventMouseDown: boolean = true): void {
        let focusOutTimeout: number = 0;
        let target: HTMLElement;

        element.onFocusOut((event: Event) => {
            if (target === event.target) {
                focusOutTimeout = window.setTimeout(() => onFocusOut(target), wait);
            }
        });

        element.onFocusIn((event: Event) => {
            target = event.target as HTMLElement;
            clearTimeout(focusOutTimeout);
        });

        // Prevent focus loss on mouse down
        if (preventMouseDown) {
            element.onMouseDown((e) => {
                // if click is inside of input then focus will remain in it and no need to prevent default
                if ((e.target as HTMLElement).tagName.toLowerCase() !== 'input') {
                    e.preventDefault();
                }
            });
        }
    }

    static lockEvent(event: Event): void {
        event.stopPropagation();
        event.preventDefault();
    }

    static isDirty(element: Element): boolean {

        const checkDirty = (el: Element) => {
            // Check isDirty() on element, except root element to prevent recursion
            const canCheckForDirty = (el !== element && typeof el['isDirty'] === 'function');
            if (canCheckForDirty) {
                return el['isDirty']();
            } else if (el.getChildren().length > 0) {
                return el.getChildren().some(checkDirty);
            }
            return false;
        };

        return checkDirty(element);
    }
}
