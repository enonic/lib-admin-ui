import {Element} from './Element';
import {DivEl} from './DivEl';
import {ResponsiveManager} from '../ui/responsive/ResponsiveManager';
import {Body} from './Body';
import {ResponsiveItem} from '../ui/responsive/ResponsiveItem';

export interface ObservableConfig {
    element: Element;
    className?: string;
    rightAligned?: boolean;
    autoWidth?: boolean;
}

export class ObservableContainer
    extends DivEl {

    private static visibilityClass: string = 'visible';

    private readonly observant: Element;
    private readonly rightAligned: boolean;
    private readonly autoWidth: boolean;

    private visible: boolean;
    private observer: IntersectionObserver;

    constructor(config: ObservableConfig) {
        super(config.className || 'observable-container');

        this.observant = config.element;
        this.rightAligned = config.rightAligned || false;
        this.autoWidth = config.autoWidth || false;

        this.observant.whenRendered(() => {
            this.initListeners();

            this.observant.wrapWithElement(this);
        });
    }

    private initListeners() {
        const handler = () => this.alignToParent();
        const scrollableParent = this.observant.getScrollableParent();
        let responsiveItem: ResponsiveItem;

        this.createObserver(handler);

        const onAddedHandler = () => {
            this.observer.observe(this.observant.getHTMLElement());

            responsiveItem = ResponsiveManager.onAvailableSizeChanged(Body.get(), handler);

            if (scrollableParent) {
                scrollableParent.onScroll(handler);
            }
        }

        this.onAdded(() => onAddedHandler());

        this.onRemoved(() => {
            this.unAdded(onAddedHandler);
            this.observer.disconnect();
            scrollableParent.unScroll(handler)
            ResponsiveManager.unAvailableSizeChangedByItem(responsiveItem);
        });
    }

    private createObserver(callback: () => void) {
        const options = {
            root: this.getHTMLElement()
        };

        this.visible = false;
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                this.visible = (entry.intersectionRatio > 0);
                if (this.visible) {
                    callback();
                }
            });
        }, options);
    }

    private alignToParent() {
        if (!this.visible) {
            return;
        }
        this.alignToParentPosition();
        this.alignWithParentWidth();
    }

    private alignToParentPosition() {
        this.alignVertically();
        this.alignHorizontally();
    }

    private alignVertically() {
        const hostEl = this.getParentElement().getEl();
        const hostDimensions = hostEl.getBoundingClientRect();
        const hostWidth = hostEl.getWidthWithBorder();

        if (this.rightAligned) {
            const elementWidth = Math.max(this.getEl().getWidthWithBorder(), hostWidth);
            this.getEl().setLeftPx(hostDimensions.left + hostWidth - elementWidth);
        } else {
            this.getEl().setLeftPx(hostDimensions.left);
        }
    }

    private alignHorizontally() {
        const hostEl = this.getParentElement().getEl();
        const viewHeight = Body.get().getEl().getHeightWithBorder();
        const hostDimensions = hostEl.getBoundingClientRect();
        const heightEl = this.getEl().getHeightWithBorder();

        const spaceToBottom = viewHeight - hostDimensions.bottom;
        const spaceToTop = hostDimensions.top;

        if (heightEl > spaceToBottom) {
            if (heightEl <= spaceToTop) {
                this.getEl().setTopPx(hostDimensions.top - heightEl);
            } else {
                this.getEl().setHeightPx(spaceToBottom - 5);
            }
            return;
        }

        this.getEl().setTopPx(hostDimensions.top + hostDimensions.height);
    }

    private alignWithParentWidth() {
        const parentWidth = this.getParentElement().getEl().getWidthWithBorder();
        if (this.autoWidth) {
            this.getEl().setMinWidth(`${parentWidth}px`).setWidth('auto');
        } else {
            this.getEl().setWidth(`${parentWidth}px`);
        }
    }
}
