import {ResponsiveManager} from '../responsive/ResponsiveManager';
import {DivEl} from '../../dom/DivEl';
import {DragMask} from '../mask/DragMask';
import {AppHelper} from '../../util/AppHelper';
import {Element} from '../../dom/Element';
import {ClassHelper} from '../../ClassHelper';
import {Panel} from './Panel';
import {assert} from '../../util/Assert';
import {Body} from '../../dom/Body';
import {SplitPanelSize} from './SplitPanelSize';
import {ResponsiveItem} from '../responsive/ResponsiveItem';

export enum SplitPanelAlignment {
    HORIZONTAL,
    VERTICAL
}

export class SplitPanelBuilder {

    private firstPanel: Panel;

    private secondPanel: Panel;

    private firstPanelSize: SplitPanelSize = SplitPanelSize.AUTO();

    private firstPanelMinSize: SplitPanelSize = SplitPanelSize.PERCENTS(0);

    private secondPanelSize: SplitPanelSize = SplitPanelSize.AUTO();

    private secondPanelMinSize: SplitPanelSize = SplitPanelSize.PERCENTS(0);

    private alignment: SplitPanelAlignment = SplitPanelAlignment.HORIZONTAL;

    private alignmentTreshold: number;

    private animationDelay: number = 0;

    private splitterThickness: number = 5;

    // property that indicates to slide second panel instead of hide while in horizontal layout
    private secondPanelShouldSlideRight: boolean = false;

    constructor(firstPanel: Panel, secondPanel: Panel) {
        this.firstPanel = firstPanel;
        this.secondPanel = secondPanel;
    }

    build(): SplitPanel {
        return new SplitPanel(this);
    }

    setFirstPanelSize(size: SplitPanelSize): SplitPanelBuilder {
        this.firstPanelSize = size;
        return this;
    }

    setFirstPanelMinSize(size: SplitPanelSize): SplitPanelBuilder {
        this.firstPanelMinSize = size;
        return this;
    }

    setSecondPanelSize(size: SplitPanelSize): SplitPanelBuilder {
        this.secondPanelSize = size;
        return this;
    }

    setSecondPanelMinSize(size: SplitPanelSize): SplitPanelBuilder {
        this.secondPanelMinSize = size;
        return this;
    }

    setAlignment(alignment: SplitPanelAlignment): SplitPanelBuilder {
        this.alignment = alignment;
        return this;
    }

    setAlignmentTreshold(treshold: number): SplitPanelBuilder {
        this.alignmentTreshold = treshold;
        return this;
    }

    setAnimationDelay(value: number): SplitPanelBuilder {
        this.animationDelay = value;
        return this;
    }

    setSplitterThickness(thickness: number): SplitPanelBuilder {
        this.splitterThickness = thickness;
        return this;
    }

    setSecondPanelShouldSlideRight(value: boolean): SplitPanelBuilder {
        this.secondPanelShouldSlideRight = value;
        return this;
    }

    getFirstPanel(): Panel {
        return this.firstPanel;
    }

    getFirstPanelMinSize(): SplitPanelSize {
        return this.firstPanelMinSize;
    }

    getSecondPanel(): Panel {
        return this.secondPanel;
    }

    getSecondPanelMinSize(): SplitPanelSize {
        return this.secondPanelMinSize;
    }

    getFirstPanelSize(): SplitPanelSize {
        return this.firstPanelSize;
    }

    getSecondPanelSize(): SplitPanelSize {
        return this.secondPanelSize;
    }

    getAlignment(): SplitPanelAlignment {
        return this.alignment;
    }

    getAlignmentTreshold(): number {
        return this.alignmentTreshold;
    }

    getAnimationDelay(): number {
        return this.animationDelay;
    }

    getSplitterThickness(): number {
        return this.splitterThickness;
    }

    isSecondPanelShouldSlideRight(): boolean {
        return this.secondPanelShouldSlideRight;
    }
}

export class SplitPanel
    extends Panel {

    protected firstPanel: Panel;

    protected firstPanelResponsiveItem: ResponsiveItem;

    protected secondPanel: Panel;

    protected secondPanelResponsiveItem: ResponsiveItem;

    protected firstPanelSize: SplitPanelSize;

    protected firstPanelMinSize: SplitPanelSize;

    protected secondPanelSize: SplitPanelSize;

    protected secondPanelMinSize: SplitPanelSize;

    private splitterThickness: number;

    protected splitter: DivEl;

    protected alignment: SplitPanelAlignment;

    private alignmentTreshold: number;

    protected ghostDragger: DivEl;

    private dragListener: (e: MouseEvent) => void;

    private mask: DragMask;

    protected splitterPosition: number;

    protected firstPanelIsHidden: boolean;

    protected firstPanelIsFullScreen: boolean;

    protected secondPanelIsHidden: boolean;

    protected hiddenFirstPanelPreviousSize: SplitPanelSize;

    protected hiddenSecondPanelPreviousSize: SplitPanelSize;

    protected splitterIsHidden: boolean;

    protected savedFirstPanelSize: SplitPanelSize;

    protected savedFirstPanelMinSize: SplitPanelSize;

    protected savedSecondPanelSize: SplitPanelSize;

    protected savedSecondPanelMinSize: SplitPanelSize;

    private animationDelay: number;

    private secondPanelShouldSlideRight: boolean;

    private triggerResizeDebounced: () => void;

    private panelResizedListeners: (() => void)[] = [];

    constructor(builder: SplitPanelBuilder) {
        super('split-panel');
        this.firstPanel = builder.getFirstPanel();
        this.firstPanelMinSize = builder.getFirstPanelMinSize();
        this.secondPanel = builder.getSecondPanel();
        this.secondPanelMinSize = builder.getSecondPanelMinSize();
        this.animationDelay = builder.getAnimationDelay();
        this.secondPanelShouldSlideRight = builder.isSecondPanelShouldSlideRight();
        this.firstPanelIsHidden = false;
        this.secondPanelIsHidden = false;
        this.firstPanelIsFullScreen = false;
        this.splitterIsHidden = false;
        this.triggerResizeDebounced = AppHelper.debounce(() => {
            this.whenRendered(() => ResponsiveManager.fireResizeEvent());
        }, this.animationDelay);

        this.savePanelSizes();

        this.firstPanelSize = builder.getFirstPanelSize();
        this.secondPanelSize = builder.getSecondPanelSize();

        this.alignment = builder.getAlignment();
        this.alignmentTreshold = builder.getAlignmentTreshold();
        this.splitterThickness = builder.getSplitterThickness();
        this.splitter = new DivEl('splitter splitter-bg-standard');

        this.firstPanel.setDoOffset(false);
        this.secondPanel.setDoOffset(false);

        super.appendChild(this.firstPanel);
        super.appendChild(this.splitter);
        super.appendChild(this.secondPanel);

        this.mask = new DragMask(this);
        super.appendChild(this.mask);
        this.onRendered(() => this.onRenderedDragHandler());

        if (this.alignmentTreshold) {
            const debounced = AppHelper.debounce(() => {
                if (this.requiresAlignment() && this.isVisible()) {
                    this.updateAlignment();
                }
            }, Math.max(100, this.animationDelay), false);
            ResponsiveManager.onAvailableSizeChanged(this, debounced);
        }

        this.onAdded(() => {
            // wait 1ms to ensure browser calculated element dimensions and styles
            setTimeout(() => {
                /*
                let splitPanelSize = this.isHorizontal() ? this.getEl().getHeight() : this.getEl().getWidth();
                assert(this.firstPanelMinSize + this.secondPanelMinSize <= splitPanelSize,
                    'warning: total sum of first and second panel minimum sizes exceed total split panel size');
                 */
                this.updateAlignment();
            }, 1);
        });

        // Add all elements, needed to be tracked
        ResponsiveManager.onAvailableSizeChanged(this);
        this.firstPanelResponsiveItem = ResponsiveManager.onAvailableSizeChanged(this.firstPanel);
        this.secondPanelResponsiveItem = ResponsiveManager.onAvailableSizeChanged(this.secondPanel);

        this.onRemoved(() => {
            ResponsiveManager.unAvailableSizeChanged(this);
            ResponsiveManager.unAvailableSizeChanged(this.firstPanel);
            ResponsiveManager.unAvailableSizeChanged(this.secondPanel);
        });
    }

    setFirstPanelSize(size: SplitPanelSize) {
        this.firstPanelSize = size;
        this.secondPanelSize = SplitPanelSize.AUTO();
    }

    setFirstPanelIsFullScreen(fullScreen: boolean) {
        this.firstPanelIsFullScreen = fullScreen;
    }

    setSecondPanelSize(size: SplitPanelSize) {
        this.secondPanelSize = size;
        this.firstPanelSize = SplitPanelSize.AUTO();
    }

    savePanelSizes() {
        this.savedFirstPanelSize = this.firstPanelSize;
        this.savedFirstPanelMinSize = this.firstPanelMinSize;

        this.savedSecondPanelSize = this.secondPanelSize;
        this.savedSecondPanelMinSize = this.secondPanelMinSize;
    }

    loadPanelSizes() {
        this.firstPanelSize = this.savedFirstPanelSize;
        this.firstPanelMinSize = this.savedFirstPanelMinSize;

        this.secondPanelSize = this.savedSecondPanelSize;
        this.secondPanelMinSize = this.savedSecondPanelMinSize;
    }

    savePanelSizesAndDistribute(newFirstPanelSize: SplitPanelSize) {
        this.savePanelSizes();
        this.firstPanelSize = newFirstPanelSize.isAuto() ? this.firstPanelSize : newFirstPanelSize;
        this.secondPanelSize = SplitPanelSize.AUTO();
        this.distribute();
    }

    loadPanelSizesAndDistribute() {
        this.loadPanelSizes();
        this.distribute();
    }

    appendChild<T extends Element>(_child: T): Element {
        throw Error('SplitPanel allows adding children in constructor only.');
    }

    appendChildren<T extends Element>(..._children: T[]): Element {
        throw Error('SplitPanel allows adding children in constructor only.');
    }

    prependChild(_child: Element): Element {
        throw Error('SplitPanel allows adding children in constructor only.');
    }

    showSplitter() {
        this.splitter.show();
    }

    hideSplitter() {
        this.splitter.hide();
    }

    distribute(noResizeEvent: boolean = false): void {
        if (this.isHorizontal()) {
            this.distributeHeight();
        } else {
            this.distributeWidth();
            this.updateSplitterPos();
        }

        this.updatePanelsAfterDistribute(noResizeEvent);
    }

    isHorizontal() {
        return this.alignment === SplitPanelAlignment.HORIZONTAL;
    }

    protected distributeHeight(): void {
        this.firstPanel.getEl().setHeight(this.getPanelSizeString(1)).setWidth(null);
        this.secondPanel.getEl().setHeight(this.getPanelSizeString(2)).setWidth(null);
        this.splitter.getEl().setHeightPx(this.getSplitterThickness()).setWidth(null).setLeft(null);
    }

    getPanelSizeString(panelNumber: number): string {
        assert((panelNumber === 1 || panelNumber === 2), 'Panel number must be 1 or 2');

        const size: SplitPanelSize = (panelNumber === 1) ? this.firstPanelSize : this.secondPanelSize;
        const otherPanelSize: SplitPanelSize = (panelNumber === 1) ? this.secondPanelSize : this.firstPanelSize;

        if ((panelNumber === 1 && this.isSecondPanelHidden()) || (panelNumber === 2 && this.isFirstPanelHidden())) {
            return '100%';
        } else if ((panelNumber === 1 && this.isFirstPanelHidden()) || (panelNumber === 2 && this.isSecondPanelHidden())) {
            return '0';
        }

        if (!size.isAuto()) { // This panel is the deciding panel
            return size.isPixelsUnit() ?
                   `${size.getValue() - (this.getSplitterThickness() / 2)}px` :
                   `calc(${size.getValue()}% - ${(this.getSplitterThickness() / 2)}px)`;
        }

        // Other panel is the deciding panel
        return otherPanelSize.isPixelsUnit() ?
               `calc(100% - ${(otherPanelSize.getValue() + (this.getSplitterThickness() / 2))}px)` :
               `calc(${(100 - otherPanelSize.getValue())}% - ${(this.getSplitterThickness() / 2)}px)`;
    }

    protected distributeWidth(): void {
        this.firstPanel.getEl().setWidth(this.getPanelSizeString(1)).setHeight(null);
        this.secondPanel.getEl().setWidth(this.getPanelSizeString(2)).setHeight(null);
        this.splitter.getEl().setWidthPx(this.getSplitterThickness()).setHeight(null);
    }

    protected updatePanelsAfterDistribute(noResizeEvent: boolean): void {
        if (!this.isVisible()) {
            return;
        }

        if (noResizeEvent) {
            this.firstPanelResponsiveItem.update();
            this.secondPanelResponsiveItem.update();
        } else {
            this.triggerResizeDebounced();
        }

        this.notifyPanelResized();
    }

    protected updateSplitterPos(): void {
        if (this.firstPanelSize.isPercentsUnit() && this.secondPanelSize.isPercentsUnit()) {
            const positionInPercentage: number = (!this.firstPanelSize.isAuto()) ?
                                                 this.firstPanelSize.getValue() : 100 - this.secondPanelSize.getValue();
            this.splitter.getEl().setLeft('calc(' + positionInPercentage + '% - ' + (this.getSplitterThickness() / 2) + 'px)');
        } else {
            this.splitter.getEl().setLeft(this.getPanelSizeString(1));
        }
    }

    onPanelResized(listener: () => void): void {
        this.panelResizedListeners.push(listener);
    }

    unPanelResized(listener: () => void): void {
        this.panelResizedListeners = this.panelResizedListeners.filter((curr: () => void) => curr !== listener);
    }

    showFirstPanel() {
        if (!this.firstPanelIsHidden) {
            return;
        }

        if (this.firstPanelIsFullScreen) {
            this.firstPanelSize = SplitPanelSize.AUTO();
        } else {
            this.firstPanelSize = this.hiddenFirstPanelPreviousSize;

            this.splitterIsHidden = false;
            this.showSplitter();
        }

        this.firstPanel.show();

        this.firstPanelIsHidden = false;
        this.distribute();
    }

    showSecondPanel(showSplitter: boolean = true) {
        if (!this.secondPanelIsHidden) {
            return;
        }

        this.splitterIsHidden = false;
        if (showSplitter) {
            this.showSplitter();
        }

        this.secondPanelSize = this.hiddenSecondPanelPreviousSize;
        this.secondPanel.show();

        this.secondPanelIsHidden = false;
        this.distribute();

        if (this.secondPanelShouldSlideRight) {
            this.slideInSecondPanelFromRight();
        }
    }

    hideFirstPanel() {
        if (this.firstPanelIsHidden) {
            return;
        }

        this.splitterIsHidden = true;
        this.hideSplitter();

        if (!this.firstPanelIsFullScreen) {
            this.hiddenFirstPanelPreviousSize = this.firstPanelSize;
        }

        this.firstPanelSize = new SplitPanelSize(0, this.firstPanelSize.getUnit());
        this.firstPanel.hide();

        this.firstPanelIsHidden = true;
        this.distribute();
    }

    hideSecondPanel() {
        if (this.secondPanelIsHidden) {
            return;
        }

        this.secondPanel.hide();
        this.foldSecondPanel();
    }

    foldSecondPanel() {
        if (this.secondPanelIsHidden) {
            return;
        }

        this.splitterIsHidden = true;
        this.hideSplitter();

        if (this.secondPanelShouldSlideRight) {
            this.slideOutSecondPanelRight();
        }

        this.hiddenSecondPanelPreviousSize = this.secondPanelSize;
        this.secondPanelSize = new SplitPanelSize(0, this.secondPanelSize.getUnit());

        this.secondPanelIsHidden = true;
        this.distribute();
    }

    getActiveWidthPxOfSecondPanel(): number {
        if (!this.secondPanelIsHidden) {
            return this.secondPanel.getEl().getWidthWithBorder();
        }

        if (this.hiddenSecondPanelPreviousSize.isPixelsUnit()) {
            return this.hiddenSecondPanelPreviousSize.getValue();
        }

        return this.getEl().getWidthWithBorder() / 100 * this.hiddenSecondPanelPreviousSize.getValue();

    }

    setActiveWidthPxOfSecondPanel(value: SplitPanelSize): void {
        if (this.secondPanelIsHidden) {
            this.hiddenSecondPanelPreviousSize = value;
        } else {
            this.secondPanelSize = value;
        }
    }

    isFirstPanelHidden() {
        return this.firstPanelIsHidden;
    }

    isSecondPanelHidden() {
        return this.secondPanelIsHidden;
    }

    getSplitterThickness(): number {
        return this.splitterIsHidden ? 0 : this.splitterThickness;
    }

    setSplitterIsHidden(value: boolean) {
        this.splitterIsHidden = value;
    }

    addSplitterClass(className: string): void {
        this.splitter.addClass(className);
    }

    removeSplitterClass(className: string): void {
        this.splitter.removeClass(className);
    }

    toString(): string {
        return ClassHelper.getClassName(this) + '[' + this.getId() + ']';
    }

    private onRenderedDragHandler() {
        let initialPos: number = 0;
        this.ghostDragger = new DivEl('ghost-dragger');
        this.dragListener = (e: MouseEvent) => {
            if (this.isHorizontal()) {
                if (this.isSplitterWithinBoundaries(initialPos - e.clientY)) {
                    this.splitterPosition = e.clientY;
                    this.ghostDragger.getEl().setTopPx(e.clientY - this.getEl().getOffsetTop());
                }
            } else {
                if (this.isSplitterWithinBoundaries(initialPos - e.clientX)) {
                    this.splitterPosition = e.clientX;
                    this.ghostDragger.getEl().setLeftPx(e.clientX - this.getEl().getOffsetLeft());
                }
            }
        };

        const mouseUpHandler = () => {
            this.stopDrag();
            super.removeChild(this.ghostDragger);
            Body.get().unMouseUp(mouseUpHandler);
        };

        this.splitter.onMouseDown((e: MouseEvent) => {
            e.preventDefault();

            initialPos = this.isHorizontal() ? e.clientY : e.clientX;

            this.ghostDragger.insertBeforeEl(this.splitter);

            Body.get().onMouseUp(mouseUpHandler);

            this.startDrag();
        });

    }

    private startDrag() {
        this.mask.show();
        this.addClass('dragging');
        Body.get().onMouseMove(this.dragListener);

        if (this.isHorizontal()) {
            this.ghostDragger.getEl().setTopPx(this.splitter.getEl().getOffsetTopRelativeToParent()).setLeft(null);
        } else {
            this.ghostDragger.getEl().setLeftPx(this.splitter.getEl().getOffsetLeftRelativeToParent()).setTop(null);
        }
    }

    private stopDrag() {
        this.mask.hide();
        this.removeClass('dragging');
        Body.get().unMouseMove(this.dragListener);

        let splitPanelEl = this.getEl();
        let dragOffset = this.isHorizontal() ? this.splitterPosition - splitPanelEl.getOffsetTop() : this.splitterPosition -
                                                                                                     splitPanelEl.getOffsetLeft();
        let splitPanelSize = this.isHorizontal() ? splitPanelEl.getHeightWithBorder() : splitPanelEl.getWidthWithBorder();

        if (this.firstPanelSize.isPercentsUnit()) {
            this.firstPanelSize = SplitPanelSize.PERCENTS((dragOffset / splitPanelSize) * 100);
            this.setSecondPanelSize(SplitPanelSize.PERCENTS(100 - this.firstPanelSize.getValue()));
        } else {
            this.firstPanelSize = SplitPanelSize.PIXELS(dragOffset);
        }

        this.distribute(true);
    }

    private isSplitterWithinBoundaries(offset: number): boolean {
        const firstPanelSize: number = this.isHorizontal() ? this.firstPanel.getEl().getHeight() : this.firstPanel.getEl().getWidth();
        const secondPanelSize: number = this.isHorizontal() ? this.secondPanel.getEl().getHeight() : this.secondPanel.getEl().getWidth();

        const newFirstPanelWidth: number = firstPanelSize - offset;
        const newSecondPanelWidth: number = secondPanelSize + offset;

        return (newFirstPanelWidth >= this.firstPanelMinSize.getValue()) && (newSecondPanelWidth >= this.secondPanelMinSize.getValue());
    }

    private requiresAlignment() {
        if (this.alignmentTreshold) {
            let splitPanelWidth = this.getEl().getWidthWithMargin();
            if (splitPanelWidth > this.alignmentTreshold && this.isHorizontal()) {
                return true;
            } else if (splitPanelWidth < this.alignmentTreshold && !this.isHorizontal()) {
                return true;
            }
        }
        return false;
    }

    private updateAlignment() {
        let splitPanelWidth = this.getEl().getWidthWithMargin();
        if (splitPanelWidth > this.alignmentTreshold && this.isHorizontal()) {
            this.alignment = SplitPanelAlignment.VERTICAL;
        } else if (splitPanelWidth < this.alignmentTreshold && !this.isHorizontal()) {
            this.alignment = SplitPanelAlignment.HORIZONTAL;
        }

        if (this.isHorizontal()) {
            this.removeClass('vertical');
            this.addClass('horizontal');
            this.firstPanel.getEl().setWidth(null);
            this.secondPanel.getEl().setWidth(null);
            this.splitter.getEl().setHeightPx(this.getSplitterThickness()).setWidth(null).setLeft(null);
        } else {
            this.addClass('vertical');
            this.removeClass('horizontal');
            this.firstPanel.getEl().setHeight(null);
            this.secondPanel.getEl().setHeight(null);
            this.splitter.getEl().setWidthPx(this.getSplitterThickness()).setHeight(null);
        }
        this.distribute();
    }

    private slideInSecondPanelFromRight() {
        this.secondPanel.getEl().setRightPx(0);
    }

    private slideOutSecondPanelRight() {
        this.secondPanel.getEl().setRightPx(-this.secondPanel.getEl().getWidthWithBorder());
    }

    private notifyPanelResized(): void {
        this.panelResizedListeners.forEach((listener: () => void) => listener());
    }
}
