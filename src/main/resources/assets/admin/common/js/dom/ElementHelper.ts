import * as $ from 'jquery';
import {Element} from './Element';
import {StringHelper} from '../util/StringHelper';
import {assert, assertNotNull} from '../util/Assert';

export interface ElementDimensions {
    top: number;
    left: number;
    width: number;
    height: number;
}

export class ElementHelper {

    private el: HTMLElement;

    constructor(element: HTMLElement) {
        assertNotNull(element, 'Element cannot be null');
        this.el = element;
    }

    static fromName(name: string): ElementHelper {
        assert(!StringHelper.isEmpty(name), 'Tag name cannot be empty');
        return new ElementHelper(document.createElement(name));
    }

    getHTMLElement(): HTMLElement {
        return this.el;
    }

    insertBefore(newEl: Element, existingEl: Element) {
        assertNotNull(newEl, 'New element cannot be null');
        assertNotNull(existingEl, 'Existing element cannot be null');
        this.el.insertBefore(newEl.getHTMLElement(), existingEl ? existingEl.getHTMLElement() : null);
    }

    insertBeforeEl(existingEl: ElementHelper) {
        existingEl.el.parentElement.insertBefore(this.el, existingEl.el);
    }

    insertAfterEl(existingEl: ElementHelper) {
        assertNotNull(existingEl, 'Existing element cannot be null');
        assertNotNull(existingEl.el.parentElement, 'Existing element\'s parentElement cannot be null');
        existingEl.el.parentElement.insertBefore(this.el, existingEl.el.nextElementSibling);
    }

    insertAfterThisEl(toInsert: ElementHelper) {
        assertNotNull(toInsert, 'Existing element cannot be null');
        this.el.parentElement.insertBefore(toInsert.el, this.el.nextElementSibling);
    }

    /*
     * @returns {ElementHelper} ElementHelper for previous node of this element.
     */
    getPrevious(): ElementHelper {
        let previous = this.el.previousSibling;
        while (previous && previous.nodeType !== Node.ELEMENT_NODE) {
            previous = previous.previousSibling;
        }
        return previous ? new ElementHelper(<HTMLElement>previous) : null;
    }

    getNext(): ElementHelper {
        let next = this.el.nextSibling;
        while (next && next.nodeType !== Node.ELEMENT_NODE) {
            next = next.nextSibling;
        }
        return next ? new ElementHelper(<HTMLElement>next) : null;
    }

    getParent(): ElementHelper {
        let parent = this.el.parentElement;
        return parent ? new ElementHelper(parent) : null;
    }

    setDisabled(value: boolean): ElementHelper {
        this.el['disabled'] = value;
        return this;
    }

    isDisabled(): boolean {
        return this.el['disabled'];
    }

    setAutocomplete(value: boolean): ElementHelper {
        this.el['autocomplete'] = value ? 'on' : 'off';
        return this;
    }

    hasAutocomplete(): boolean {
        return this.el['autocomplete'] === 'on';
    }

    getId(): string {
        return this.el.id;
    }

    setId(value: string): ElementHelper {
        this.el.id = value;
        return this;
    }

    setInnerHtml(value: string, escapeHtml: boolean = true): ElementHelper {
        $(this.el).html(escapeHtml ? StringHelper.escapeHtml(value) : value);
        return this;
    }

    getInnerHtml(): string {
        return this.el.innerHTML;
    }

    setText(value: string): ElementHelper {
        $(this.el).text(value);
        return this;
    }

    getText(): string {
        return this.el.innerText || this.el.textContent;
    }

    setAttribute(name: string, value: string): ElementHelper {
        this.el.setAttribute(name, value);
        return this;
    }

    getAttribute(name: string): string {
        return this.el.getAttribute(name);
    }

    hasAttribute(name: string): boolean {
        return this.el.hasAttribute(name);
    }

    removeAttribute(name: string): ElementHelper {
        this.el.removeAttribute(name);
        return this;
    }

    setData(name: string, value: string): ElementHelper {
        assert(!StringHelper.isEmpty(name), 'Name cannot be empty');
        assert(!StringHelper.isEmpty(value), 'Value cannot be empty');
        this.el.setAttribute('data-' + name, value);
        $(this.el).data(name, value);
        return this;
    }

    getData(name: string): string {
        let data = $(this.el).data(name);
        return data ? data.toString() : undefined;
    }

    getValue(): string {
        return this.el['value'];
    }

    setValue(value: string): ElementHelper {
        this.el['value'] = value || '';
        return this;
    }

    toggleClass(className: string, condition?: boolean): ElementHelper {
        if (condition === false || condition == null && this.hasClass(className)) {
            this.removeClass(className);
        } else {
            this.addClass(className);
        }
        return this;
    }

    addClass(className: string): ElementHelper {
        const trimmedClassName = className?.trim();

        assert(!StringHelper.isEmpty(trimmedClassName), 'Class name cannot be empty');

        const classList = StringHelper.removeEmptyStrings(trimmedClassName.split(' '));
        classList.forEach((classItem) => {
            if (this.el.classList && !this.hasClass(classItem)) {
                this.el.classList.add(classItem);
            }
        });
        return this;
    }

    setClass(value: string): ElementHelper {
        this.el.className = value;
        return this;
    }

    getClass(): string {
        return this.el.className;
    }

    setTitle(value: string): ElementHelper {
        this.el.title = value;
        return this;
    }

    getTitle(): string {
        return this.el.title;
    }

    hasAnyParentClass(clsName: string): boolean {
        let parent = this.getParent();
        if (!parent) {
            return false;
        }

        return parent.hasClass(clsName) || parent.hasAnyParentClass(clsName);
    }

    hasClass(clsName: string): boolean {
        assert(!StringHelper.isEmpty(clsName), 'Class name cannot be empty');
        // spaces are not allowed
        let classList: string[] = clsName.split(' ');
        for (let i = 0; i < classList.length; i++) {
            let classItem = classList[i];
            if (this.el.classList && this.el.classList.contains(classItem)) {
                return true;
            }
        }
        return false;
    }

    removeClass(clsName: string): ElementHelper {
        assert(!StringHelper.isEmpty(clsName), 'Class name cannot be empty');
        // spaces are not allowed
        let classList: string[] = clsName.split(' ');
        classList.forEach((classItem: string) => {
            if (this.el.classList) {
                this.el.classList.remove(classItem);
            }
        });
        return this;
    }

    addEventListener(eventName: string, f: (event: Event) => any, isPassive?: boolean): ElementHelper {
        if (isPassive) {
            return this.addPassiveEventListener(eventName, f);
        }
        this.el.addEventListener(eventName, f, {passive: false});
        return this;
    }

    removeEventListener(eventName: string, f: (event: Event) => any): ElementHelper {
        this.el.removeEventListener(eventName, f);
        return this;
    }

    appendChild(child: Node): ElementHelper {
        return this.insertChild(child, this.countChildren());
    }

    appendChildren(children: Node[]): ElementHelper {
        children.forEach((child: Node) => {
            this.el.appendChild(child);
        });
        return this;
    }

    insertChild(child: Node, index: number): ElementHelper {
        if (index > this.countChildren() - 1) {
            this.el.appendChild(child);
        } else {
            this.el.insertBefore(child, this.getChild(index));
        }
        return this;
    }

    getTagName(): string {
        return this.el.tagName;
    }

    getDisplay(): string {
        return this.el.style.display;
    }

    setDisplay(value: string): ElementHelper {
        this.el.style.display = value;
        return this;
    }

    getOpacity(): number {
        return parseFloat(this.el.style.opacity);
    }

    setOpacity(value: number): ElementHelper {
        this.el.style.opacity = String(value);
        return this;
    }

    getVisibility(): string {
        return this.el.style.visibility;
    }

    setVisibility(value: string): ElementHelper {
        this.el.style.visibility = value;
        return this;
    }

    getPosition(): string {
        return this.getComputedProperty('position');
    }

    setPosition(value: string): ElementHelper {
        this.el.style.position = value;
        return this;
    }

    setWidth(value: string): ElementHelper {
        this.el.style.width = value;
        return this;
    }

    setWidthPx(value: number): ElementHelper {
        this.setWidth(value + 'px');
        return this;
    }

    setMaxWidth(value: string): ElementHelper {
        this.el.style.maxWidth = value;
        return this;
    }

    setMinWidth(value: string): ElementHelper {
        this.el.style.minWidth = value;
        return this;
    }

    setMaxWidthPx(value: number): ElementHelper {
        this.setMaxWidth(value + 'px');
        return this;
    }

    getWidth(): number {
        return $(this.el).innerWidth();
    }

    getWidthWithoutPadding(): number {
        return $(this.el).width();
    }

    getWidthWithBorder(): number {
        return $(this.el).outerWidth();
    }

    getWidthWithMargin(): number {
        return $(this.el).outerWidth(true);
    }

    getMinWidth(): number {
        return parseFloat(this.getComputedProperty('min-width')) || 0;
    }

    getMaxWidth(): number {
        return parseFloat(this.getComputedProperty('max-width')) || 0;
    }

    setHeight(value: string): ElementHelper {
        this.el.style.height = value;
        return this;
    }

    setHeightPx(value: number): ElementHelper {
        this.setHeight(value + 'px');
        return this;
    }

    getHeight(): number {
        return $(this.el).innerHeight();
    }

    setMaxHeight(value: string): ElementHelper {
        this.el.style.maxHeight = value;
        return this;
    }

    setMaxHeightPx(value: number): ElementHelper {
        this.setMaxHeight(value + 'px');
        return this;
    }

    getMaxHeight(): number {
        return parseFloat(this.getComputedProperty('max-height')) || 0;
    }

    setMinHeight(value: string): ElementHelper {
        this.el.style.minHeight = value;
        return this;
    }

    setMinHeightPx(value: number): ElementHelper {
        this.setMinHeight(value + 'px');
        return this;
    }

    getMinHeight(): number {
        return parseFloat(this.getComputedProperty('min-height')) || 0;
    }

    getHeightWithoutPadding(): number {
        return $(this.el).height();
    }

    getHeightWithBorder(): number {
        return $(this.el).outerHeight();
    }

    getHeightWithMargin(): number {
        return $(this.el).outerHeight(true);
    }

    setTop(value: string): ElementHelper {
        this.el.style.top = value;
        return this;
    }

    setTopPx(value: number): ElementHelper {
        return this.setTop(value + 'px');
    }

    getTopPx(): number {
        return parseFloat(this.getTop());
    }

    getTop(): string {
        return this.el.style.top;
    }

    setBottom(value: string): ElementHelper {
        this.el.style.bottom = value;
        return this;
    }

    setBottomPx(value: number): ElementHelper {
        return this.setBottom(value + 'px');
    }

    getLeft(): string {
        return this.el.style.left;
    }

    getLeftPx(): number {
        return parseFloat(this.getLeft());
    }

    setLeftPx(value: number): ElementHelper {
        return this.setLeft(value + 'px');
    }

    setLeft(value: string): ElementHelper {
        this.el.style.left = value;
        return this;
    }

    setRight(value: string): ElementHelper {
        this.el.style.right = value;
        return this;
    }

    setRightPx(value: number): ElementHelper {
        return this.setRight(value + 'px');
    }

    getMarginLeft(): number {
        return parseFloat(this.getComputedProperty('margin-left')) || 0;
    }

    setMarginLeft(value: string): ElementHelper {
        this.el.style.marginLeft = value;
        return this;
    }

    getMarginRight(): number {
        return parseFloat(this.getComputedProperty('margin-right')) || 0;
    }

    setMarginRight(value: string): ElementHelper {
        this.el.style.marginRight = value;
        return this;
    }

    getMarginTop(): number {
        return parseFloat(this.getComputedProperty('margin-top')) || 0;
    }

    setMarginTop(value: string): ElementHelper {
        this.el.style.marginTop = value;
        return this;
    }

    getMarginBottom(): number {
        return parseFloat(this.getComputedProperty('margin-bottom')) || 0;
    }

    setMarginBottom(value: string): ElementHelper {
        this.el.style.marginBottom = value;
        return this;
    }

    setStroke(value: string): ElementHelper {
        this.el.style.stroke = value;
        return this;
    }

    getStroke(): string {
        return this.getComputedProperty('stroke');
    }

    setStrokeDasharray(value: string): ElementHelper {
        this.el.style.strokeDasharray = value;
        return this;
    }

    getStrokeDasharray(): string {
        return this.getComputedProperty('stroke-dasharray');
    }

    setFill(value: string): ElementHelper {
        this.el.style.fill = value;
        return this;
    }

    getFill(): string {
        return this.getComputedProperty('fill');
    }

    getPaddingLeft(): number {
        return parseFloat(this.getComputedProperty('padding-left')) || 0;
    }

    setPaddingLeft(value: string): ElementHelper {
        this.el.style.paddingLeft = value;
        return this;
    }

    getPaddingRight(): number {
        return parseFloat(this.getComputedProperty('padding-right')) || 0;
    }

    setPaddingRight(value: string): ElementHelper {
        this.el.style.paddingRight = value;
        return this;
    }

    getPaddingTop(): number {
        return parseFloat(this.getComputedProperty('padding-top')) || 0;
    }

    setPaddingTop(value: string): ElementHelper {
        this.el.style.paddingTop = value;
        return this;
    }

    getPaddingBottom(): number {
        return parseFloat(this.getComputedProperty('padding-bottom'));
    }

    setPaddingBottom(value: string): ElementHelper {
        this.el.style.paddingBottom = value;
        return this;
    }

    getBorderTopWidth(): number {
        return parseFloat(this.getComputedProperty('border-top-width')) || 0;
    }

    getBorderBottomWidth(): number {
        return parseFloat(this.getComputedProperty('border-bottom-width')) || 0;
    }

    getBorderRightWidth(): number {
        return parseFloat(this.getComputedProperty('border-right-width')) || 0;
    }

    getBorderLeftWidth(): number {
        return parseFloat(this.getComputedProperty('border-left-width')) || 0;
    }

    setZindex(value: number): ElementHelper {
        this.el.style.zIndex = value.toString();
        return this;
    }

    getBoundingClientRect(): ClientRect {
        return this.el.getBoundingClientRect();
    }

    scrollIntoView(top?: boolean): ElementHelper {
        this.el.scrollIntoView(top);
        return this;
    }

    getScrollTop(): number {
        return this.el.scrollTop;
    }

    setScrollTop(top: number): ElementHelper {
        this.el.scrollTop = top;
        return this;
    }

    getTabIndex(): number {
        return this.el.tabIndex;
    }

    setTabIndex(tabIndex: number): ElementHelper {
        this.el.tabIndex = tabIndex;
        return this;
    }

    getFontSize(): string {
        return this.getComputedProperty('font-size');
    }

    setFontSize(value: string): ElementHelper {
        this.el.style.fontSize = value;
        return this;
    }

    setBackgroundImage(value: string): ElementHelper {
        this.el.style.backgroundImage = value;
        return this;
    }

    setCursor(value: string): ElementHelper {
        this.el.style.cursor = value;
        return this;
    }

    getCursor(): string {
        return this.el.style.cursor;
    }

    getElementsByClassName(className: string): ElementHelper[] {
        let items: ElementHelper[] = [];
        if (className) {
            let nodeList = this.el.getElementsByClassName(className);
            for (let i = 0; i < nodeList.length; i++) {
                items.push(new ElementHelper(<HTMLElement>nodeList.item(i)));
            }
        }
        return items;
    }

    remove() {
        let parent = this.el.parentElement;
        if (parent) {
            parent.removeChild(this.el);
        }
    }

    contains(element: HTMLElement): boolean {
        return this.el.contains ? this.el.contains(element) : !!(this.el.compareDocumentPosition(element) & 16);
    }

    /**
     * Calculate offset relative to document
     * @returns {{left: number, top: number}}
     */
    getOffset(): {
        top: number; left: number;
    } {
        return $(this.el).offset();
    }

    setOffset(offset: { top: number; left: number; }): ElementHelper {
        $(this.el).offset(offset);
        return this;
    }

    getDimensions(): ElementDimensions {
        let offset = this.getOffset();

        return {
            top: offset.top,
            left: offset.left,
            width: this.getWidthWithBorder(),
            height: this.getHeightWithBorder()
        };
    }

    getDimensionsTopRelativeToParent(): ElementDimensions {
        let offsetToParent = this.getOffsetToParent();
        let offsetToDocument = this.getOffset();

        return {
            top: offsetToParent.top,
            left: offsetToDocument.left,
            width: this.getWidthWithBorder(),
            height: this.getHeightWithBorder()
        };
    }

    /**
     * Goes up the hierarchy and returns first non-statically positioned parent
     * @returns {HTMLElement}
     */
    getOffsetParent(): HTMLElement {
        return $(this.el).offsetParent()[0];
    }

    /**
     * Calculates offset relative to first positioned parent ( element with position: relative, absolute or fixed )
     * @returns {{top: number, left: number}}
     */
    getOffsetToParent(): {
        top: number; left: number;
    } {
        return $(this.el).position();
    }

    getOffsetTop(): number {
        return this.getOffset().top;
    }

    getOffsetTopRelativeToParent(): number {
        return this.el.offsetTop;
    }

    getOffsetLeft(): number {
        return this.getOffset().left;
    }

    getOffsetLeftRelativeToParent(): number {
        return this.el.offsetLeft;
    }

    isScrollable(): boolean {
        return this.getComputedProperty('overflow') === 'auto' || this.getComputedProperty('overflow-y') === 'auto' ||
               this.hasClass('slimScrollDiv');
    }

    getComputedProperty(name: string, pseudoElement: string = null): string {
        return window.getComputedStyle(this.el, pseudoElement).getPropertyValue(name);
    }

    focus() {
        this.el.focus();
    }

    blur() {
        this.el.blur();
    }

    /**
     * Returns the index of this element among it's siblings. Returns 0 if first or only child.
     */
    getSiblingIndex(): number {

        const getPrevSibling = (elem) => <HTMLElement>elem.previousElementSibling;
        let prev: HTMLElement;
        let index;

        for (index = 0, prev = getPrevSibling(this.el); !!prev; index++) {
            prev = getPrevSibling(prev);
        }

        return index;
    }

    isVisible(): boolean {
        return $(this.el).is(':visible');
    }

    countChildren(): number {
        return this.getChildren().length;
    }

    getChild(index: number): Node {
        return this.getChildren()[index];
    }

    getChildren(): Node[] {
        //children property not supported for IE SVGelement, Document and DocumentFragment
        return !!this.el.children ? [].slice.call(this.el.children) :
               Array.prototype.slice.call(this.el.childNodes).filter((childNode: Node) => {
                   return (childNode.nodeType === Node.ELEMENT_NODE);
               });
    }

    isOverflown() {
        return this.el.offsetWidth < this.el.scrollWidth;
    }

    private addPassiveEventListener(eventName: string, f: (event: Event) => any): ElementHelper {
        try {
            this.el.addEventListener(eventName, f, {passive: true});
            return this;
        } catch {
            return this.addEventListener(eventName, f);
        }
    }

    scrollParent(includeHidden?: boolean): HTMLElement {
        let style = getComputedStyle(this.el);
        const excludeStaticParent = style.position === 'absolute';
        const overflowRegex = includeHidden ? /(auto|scroll|hidden)/ : /(auto|scroll)/;

        if (style.position === 'fixed') {
            return document.body;
        }

        for (let parent = this.el; ; (parent = parent.parentElement)) {
            if (parent == null) {
                break;
            }
            style = getComputedStyle(parent);
            if (excludeStaticParent && style.position === 'static') {
                continue;
            }

            const overflow = style.overflow + style.overflowY + style.overflowX;
            if (overflowRegex.test(overflow)) {
                return parent;
            }
        }

        return document.body;
    }
}
