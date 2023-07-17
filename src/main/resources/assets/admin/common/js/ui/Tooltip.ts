import {DivEl} from '../dom/DivEl';
import {Element} from '../dom/Element';
import {StyleHelper} from '../StyleHelper';
import {Body} from '../dom/Body';
import {WindowDOM} from '../dom/WindowDOM';
import {Store} from '../store/Store';

export const TOOLTIPS_KEY: string = 'tooltips';

export class Tooltip {

    static SIDE_TOP: string = 'top';
    static SIDE_RIGHT: string = 'right';
    static SIDE_BOTTOM: string = 'bottom';
    static SIDE_LEFT: string = 'left';

    static TRIGGER_HOVER: string = 'hover';
    static TRIGGER_FOCUS: string = 'focus';
    static TRIGGER_NONE: string = 'none';

    static MODE_STATIC: string = 'static';
    static MODE_GLOBAL_STATIC: string = 'global_static';
    static MODE_FOLLOW: string = 'follow';

    private static multipleAllowed: boolean = true;

    private tooltipEl: DivEl;
    private timeoutTimer: number;

    private overListener: () => any;
    private outListener: () => any;
    private moveListener: (event: MouseEvent) => any;

    private targetEl: Element;
    private text: string;
    private contentEl: Element;
    private showDelay: number;
    private hideTimeout: number;
    private trigger: string;
    private side: string;
    private mode: string;

    private active: boolean = true;

    /*
     * Widget to show floating tooltips
     * Tooltip position can be adjusted in css using left,top attributes
     *
     * @param target Element to show tooltip at
     * @param text Text of the tooltip
     * @param hideTimeout Time to keep tooltip visible after leaving target
     * @param showDelay Time to hover mouse on target before showing tooltip
     * @param trigger Event type to hook on (mouse,focus)
     * @param side Side of the target where tooltip should be shown (top,left,right,bottom)
     */
    constructor(target: Element, text?: string, showDelay: number = 0, hideTimeout: number = 0) {

        this.targetEl = target;
        this.text = text;
        this.showDelay = showDelay;
        this.hideTimeout = hideTimeout;
        this.side = Tooltip.SIDE_BOTTOM;

        this.overListener = () => this.startShowDelay();
        this.outListener = () => this.startHideTimeout();
        this.moveListener = (event: MouseEvent) => {
            if (this.tooltipEl && this.tooltipEl.isVisible()) {
                this.positionAtMouse(event);
            }
        };

        this.setTrigger(Tooltip.TRIGGER_HOVER);
        this.setMode(Tooltip.MODE_STATIC);

        Tooltip.getTooltips().push(this);
    }

    private static getTooltips(): Tooltip[] {
        let instance: Tooltip[] = Store.parentInstance().get(TOOLTIPS_KEY);

        if (instance == null) {
            instance = [];
            Store.parentInstance().set(TOOLTIPS_KEY, instance);
        }

        return instance;
    }

    static hideOtherInstances(thisToolTip?: Tooltip) {
        Tooltip.getTooltips().forEach((tooltip: Tooltip) => {
            if (tooltip.isVisible() && (!thisToolTip || tooltip !== thisToolTip)) {
                //console.log('Hiding tooltip because multiple instances are not allowed', tooltip);
                tooltip.hide();
            }
        });
    }

    static allowMultipleInstances(allow: boolean) {
        Tooltip.multipleAllowed = allow;
    }

    static isMultipleInstancesAllowed(): boolean {
        return Tooltip.multipleAllowed;
    }

    setActive(value: boolean) {
        this.active = value;
    }

    show() {
        this.stopTimeout();

        if (!this.active) {
            return;
        }

        if (!this.tooltipEl) {
            this.tooltipEl = new DivEl('tooltip', StyleHelper.COMMON_PREFIX);
            this.tooltipEl.addClass(this.side);
            if (this.contentEl) {
                this.tooltipEl.appendChild(this.contentEl);
            } else {
                this.tooltipEl.getEl().setInnerHtml(this.text);
            }

            let appendTo;
            if (this.mode === Tooltip.MODE_STATIC) {
                appendTo = this.targetEl.getParentElement() || this.targetEl;
            } else {
                appendTo = Body.get();
            }
            appendTo.appendChild(this.tooltipEl);

            if (!Tooltip.multipleAllowed) {
                Tooltip.hideOtherInstances(this);
            }
            this.tooltipEl.show();

            if (this.mode === Tooltip.MODE_STATIC || this.mode === Tooltip.MODE_GLOBAL_STATIC) {
                this.positionByTarget();
            }
        }
    }

    hide() {
        this.stopTimeout();
        if (this.tooltipEl) {
            this.tooltipEl.remove();
            this.tooltipEl = null;
        }
    }

    isVisible(): boolean {
        return !!this.tooltipEl && this.tooltipEl.isVisible();
    }

    showAfter(ms: number): Tooltip {
        this.startShowDelay(ms);
        return this;
    }

    showFor(ms: number): Tooltip {
        this.show();
        this.startHideTimeout(ms);
        return this;
    }

    setText(text: string): Tooltip {
        this.text = text;
        this.contentEl = undefined;
        return this;
    }

    getText(): string {
        return this.text;
    }

    setContent(content: Element): Tooltip {
        this.contentEl = content;
        this.text = undefined;
        return this;
    }

    getContent(): Element {
        return this.contentEl;
    }

    setHideTimeout(timeout: number): Tooltip {
        this.hideTimeout = timeout;
        return this;
    }

    getHideTimeout(): number {
        return this.hideTimeout;
    }

    setShowDelay(delay: number): Tooltip {
        this.showDelay = delay;
        return this;
    }

    getShowDelay(): number {
        return this.showDelay;
    }

    setTrigger(trigger: string): Tooltip {
        if (trigger === this.trigger) {
            return this;
        }

        // remove old listeners
        this.targetEl.getEl().removeEventListener(this.getEventName(true), this.overListener).removeEventListener(this.getEventName(false),
            this.outListener);
        this.targetEl.unRemoved(this.outListener);
        this.targetEl.unHidden(this.outListener);

        this.trigger = trigger;

        // add new listeners
        if (trigger !== Tooltip.TRIGGER_NONE) {
            this.targetEl.getEl().addEventListener(this.getEventName(true), this.overListener).addEventListener(this.getEventName(false),
                this.outListener);
            this.targetEl.onRemoved(this.outListener);
            this.targetEl.onHidden(this.outListener);
        }
        return this;
    }

    getTrigger(): string {
        return this.trigger;
    }

    setSide(side: string): Tooltip {
        this.side = side;
        return this;
    }

    getSide(): string {
        return this.side;
    }

    setMode(mode: string): Tooltip {
        if (mode === this.mode) {
            return this;
        } else if (mode === Tooltip.MODE_STATIC || mode === Tooltip.MODE_GLOBAL_STATIC) {
            Body.get().unMouseMove(this.moveListener);
        } else if (mode === Tooltip.MODE_FOLLOW) {
            Body.get().onMouseMove(this.moveListener);
        }
        this.mode = mode;
        return this;
    }

    getMode(): string {
        return this.mode;
    }

    private positionAtMouse(event: MouseEvent) {
        let left;
        let top;
        let x = event.clientX;
        let y = event.clientY;
        let el = this.tooltipEl.getEl();
        let windowEl = WindowDOM.get().getHTMLElement() as any;
        let elProps = {
            height: el.getHeightWithMargin(),
            width: el.getWidthWithMargin(),
            // if mode === follow, tooltip is appended to body, so window scroll can affect tooltip
            scrollLeft: this.mode === Tooltip.MODE_FOLLOW ? windowEl.scrollX : 0,
            scrollTop: this.mode === Tooltip.MODE_FOLLOW ? windowEl.scrollY : 0
        };
        switch (this.side) {
        case Tooltip.SIDE_TOP:
            left = x - elProps.width / 2 + elProps.scrollLeft;
            top = y - elProps.height + elProps.scrollTop;
            break;
        case Tooltip.SIDE_BOTTOM:
            left = x - elProps.width / 2 + elProps.scrollLeft;
            top = y + elProps.scrollTop;
            break;
        case Tooltip.SIDE_LEFT:
            left = x - elProps.width + elProps.scrollLeft;
            top = y - elProps.height / 2 + elProps.scrollTop;
            break;
        case Tooltip.SIDE_RIGHT:
            left = x + elProps.scrollLeft;
            top = y - elProps.height / 2 + elProps.scrollTop;
            break;
        }
        this.tooltipEl.getEl().setLeftPx(left);
        this.tooltipEl.getEl().setTopPx(top);
    }

    private positionByTarget() {

        let targetEl = this.targetEl.getHTMLElement();
        let targetOffset = this.targetEl.getEl().getOffset();
        let el = this.tooltipEl.getEl();
        let elProps = {
            left: el.getMarginLeft() || 0,
            top: el.getMarginTop() || 0,
            height: el.getHeight(),
            width: el.getWidth()
        };

        let offsetLeft;
        let offsetTop;
        switch (this.side) {
        case Tooltip.SIDE_TOP:
            offsetLeft = targetOffset.left + (targetEl.offsetWidth - elProps.width) / 2 + elProps.left;
            offsetTop = targetOffset.top - elProps.height + elProps.top;
            break;
        case Tooltip.SIDE_BOTTOM:
            offsetLeft = targetOffset.left + (targetEl.offsetWidth - elProps.width) / 2 + elProps.left;
            offsetTop = targetOffset.top + targetEl.offsetHeight + elProps.top;
            break;
        case Tooltip.SIDE_LEFT:
            offsetLeft = targetOffset.left - elProps.width + elProps.left;
            offsetTop = targetOffset.top + (targetEl.offsetHeight - elProps.height) / 2 + elProps.top;
            break;
        case Tooltip.SIDE_RIGHT:
            offsetLeft = targetOffset.left + targetEl.offsetWidth + elProps.left;
            offsetTop = targetOffset.top + (targetEl.offsetHeight - elProps.height) / 2 + elProps.top;
            break;
        }

        // check screen edges
        // disabled end screen checks because of possible scroll
        if (offsetLeft < 0) {
            offsetLeft = 0;
        }

        if (offsetTop < 0) {
            offsetTop = 0;
        }

        el.setLeftPx(Math.floor(offsetLeft)).setTopPx(Math.floor(offsetTop));
    }

    private startHideTimeout(ms?: number) {
        this.stopTimeout();
        let t = ms || this.hideTimeout;
        if (t > 0) {
            this.timeoutTimer = window.setTimeout(() => {
                this.hide();
            }, t);
        } else {
            this.hide();
        }
    }

    private startShowDelay(ms?: number) {
        this.stopTimeout();
        let t = ms || this.showDelay;
        if (t > 0) {
            if (this.trigger === Tooltip.TRIGGER_HOVER) {
                // if tooltip target element becomes disabled it doesn't generate mouse leave event
                // so we need to check whether mouse has moved from tooltip target or not
                //this.hideOnMouseOut();
            }
            this.timeoutTimer = window.setTimeout(() => {
                this.show();
            }, t);
        } else {
            this.show();
        }
    }

    private stopTimeout() {
        if (this.timeoutTimer) {
            clearTimeout(this.timeoutTimer);
            this.timeoutTimer = undefined;
        }
    }

    private getEventName(enter: boolean) {
        switch (this.trigger) {
        case Tooltip.TRIGGER_FOCUS:
            return enter ? 'focus' : 'blur';
        case Tooltip.TRIGGER_HOVER:
        default:
            return enter ? 'mouseenter' : 'mouseleave';
        }
    }

}
