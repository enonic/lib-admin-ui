import {WindowDOM} from '../../dom/WindowDOM';
import {Element} from '../../dom/Element';
import {ResponsiveListener} from './ResponsiveListener';
import {ResponsiveItem} from './ResponsiveItem';

export class ResponsiveManager {

    private static window: WindowDOM = WindowDOM.get();

    private static responsiveListeners: ResponsiveListener[] = [];

    // Custom handler will be executed in addition on element update
    static onAvailableSizeChanged(el: Element,
                                  handler?: (item: ResponsiveItem) => void): ResponsiveItem {
        const responsiveItem: ResponsiveItem = new ResponsiveItem(el, handler);
        let listener = () => {
            if (el.isVisible()) {
                responsiveItem.update();
            }
        };
        let responsiveListener = new ResponsiveListener(responsiveItem, listener);

        this.updateItemOnShown(el, responsiveItem);

        ResponsiveManager.responsiveListeners.push(responsiveListener);

        ResponsiveManager.window.getHTMLElement().addEventListener('availablesizechange', listener);
        ResponsiveManager.window.onResized(listener);

        return responsiveItem;
    }

    static unAvailableSizeChanged(el: Element) {

        ResponsiveManager.responsiveListeners =
            ResponsiveManager.responsiveListeners.filter((curr) => {
                if (curr.getItem().getElement() === el) {
                    ResponsiveManager.window.getHTMLElement().removeEventListener('availablesizechange', curr.getListener());
                    ResponsiveManager.window.unResized(curr.getListener());
                    return false;
                } else {
                    return true;
                }
            });
    }

    static unAvailableSizeChangedByItem(item: ResponsiveItem) {

        ResponsiveManager.responsiveListeners =
            ResponsiveManager.responsiveListeners.filter((curr) => {
                if (curr.getItem() === item) {
                    ResponsiveManager.window.getHTMLElement().removeEventListener('availablesizechange', curr.getListener());
                    ResponsiveManager.window.unResized(curr.getListener());
                    return false;
                } else {
                    return true;
                }
            });
    }

    // Manual event triggering
    static fireResizeEvent() {
        let customEvent = document.createEvent('Event');
        customEvent.initEvent('availablesizechange', false, true); // No bubbling
        ResponsiveManager.window.getHTMLElement().dispatchEvent(customEvent);
    }

    static getWindow(): WindowDOM {
        return ResponsiveManager.window;
    }

    private static updateItemOnShown(el: Element, responsiveItem: ResponsiveItem) {
        if (el.isVisible()) {
            responsiveItem.update();
        } else {
            let renderedHandler = () => {
                responsiveItem.update();
                el.unShown(renderedHandler); // update needs
            };
            el.onShown(renderedHandler);
        }
    }
}
