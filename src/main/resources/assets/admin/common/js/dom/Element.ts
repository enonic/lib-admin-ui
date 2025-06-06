import * as DOMPurify from 'dompurify';
import * as $ from 'jquery';
import 'jquery-ui/ui/tabbable';
import * as Q from 'q';
import {ClassHelper} from '../ClassHelper';
import {ObjectHelper} from '../ObjectHelper';
import {StyleHelper} from '../StyleHelper';
import {KeyHelper} from '../ui/KeyHelper';
import {AriaHasPopup, AriaRole, WCAG} from '../ui/WCAG';
import {assert, assertNotNull, assertState} from '../util/Assert';
import {StringHelper} from '../util/StringHelper';
import {ElementAddedEvent} from './ElementAddedEvent';
import {ElementEvent} from './ElementEvent';
import {ElementHelper} from './ElementHelper';
import {ElementHiddenEvent} from './ElementHiddenEvent';
import {ElementRegistry} from './ElementRegistry';
import {ElementRemovedEvent} from './ElementRemovedEvent';
import {ElementRenderedEvent} from './ElementRenderedEvent';
import {ElementShownEvent} from './ElementShownEvent';

export interface PurifyConfig {
    addTags?: string[];
    addAttributes?: string[];
}

// wrapper interface for a DOMPurify interface to make a sanitize function return expected string output
interface DOMPurifyConfig extends DOMPurify.Config {
    RETURN_DOM_FRAGMENT?: false | undefined;
    RETURN_DOM?: false | undefined
}

export class ElementBuilder {

    generateId: boolean;

    className: string;

    parentElement: Element;

    setGenerateId(value: boolean): ElementBuilder {
        this.generateId = value;
        return this;
    }

    setClassName(cls: string, prefix?: string): ElementBuilder {
        // Ensure class has only one entry
        if (cls) {
            cls = this.getParsedClass(cls);
            if (prefix) {
                cls = StyleHelper.getCls(cls, prefix);
            }
        }
        this.className = cls;
        return this;
    }

    setParentElement(element: Element): ElementBuilder {
        this.parentElement = element;
        return this;
    }

    private getParsedClass(cls: string): string {
        return cls.trim().split(/\s+/)
            .filter((elem, index, arr) => {
                return arr.indexOf(elem) === index;
            }).join(' ');
    }

}

export class ElementFromElementBuilder
    extends ElementBuilder {

    element: Element;

    setElement(element: Element): ElementFromElementBuilder {
        this.element = element;
        return this;
    }
}

export class ElementFromHelperBuilder
    extends ElementBuilder {

    helper: ElementHelper;

    loadExistingChildren: boolean;

    setHelper(helper: ElementHelper): ElementFromHelperBuilder {
        this.helper = helper;
        return this;
    }

    setLoadExistingChildren(value: boolean): ElementFromHelperBuilder {
        this.loadExistingChildren = value;
        return this;
    }

    static fromHtmlElement(element: HTMLElement, loadExistingChildren: boolean = false, parent?: Element): ElementFromHelperBuilder {
        const builder = new ElementFromHelperBuilder()
            .setHelper(new ElementHelper(element))
            .setLoadExistingChildren(loadExistingChildren)
            .setParentElement(parent);
        return builder as ElementFromHelperBuilder;
    }

    static fromString(s: string, loadExistingChildren: boolean = true): ElementFromHelperBuilder {
        let htmlEl = $(s).get(0);
        let parentEl;
        if (htmlEl && htmlEl.parentElement) {
            parentEl = Element.fromHtmlElement(htmlEl.parentElement);
        }
        return this.fromHtmlElement(htmlEl, loadExistingChildren, parentEl);
    }
}

export class NewElementBuilder
    extends ElementBuilder {

    tagName: string;

    helper: ElementHelper;

    setTagName(name: string): NewElementBuilder {
        assert(!StringHelper.isEmpty(name), 'Tag name cannot be empty');
        this.tagName = name;
        return this;
    }

    setHelper(helper: ElementHelper): NewElementBuilder {
        this.helper = helper;
        return this;
    }
}

export enum LangDirection {
    AUTO = '',
    LTR = 'ltr',
    RTL = 'rtl'
}

export class Element {

    public static debug: boolean = false;
    private el: ElementHelper;
    private parentElement: Element;
    private children: Element[];
    private rendered: boolean;
    private rendering: boolean;
    private lazyRenderer: boolean = false;
    private childrenAddedDuringInit: boolean;
    private addedListeners: ((event: ElementAddedEvent) => void)[] = [];
    private descendantAddedListeners: ((event: ElementAddedEvent) => void)[] = [];
    private removedListeners: ((event: ElementRemovedEvent) => void)[] = [];
    private renderedListeners: ((event: ElementRenderedEvent) => void)[] = [];
    private shownListeners: ((event: ElementShownEvent) => void)[] = [];
    private hiddenListeners: ((event: ElementHiddenEvent) => void)[] = [];
    private lazyRenderListeners: (() => void)[] = [];
    private lazyRenderedListeners: (() => void)[] = [];
    /*
     *      Event listeners
     */
    private mouseEnterByHandler: object = {};
    private mouseLeaveByHandler: object = {};

    constructor(builder: ElementBuilder) {
        this.children = [];
        this.rendered = false;

        if (ObjectHelper.iFrameSafeInstanceOf(builder, ElementFromElementBuilder)) {
            let fromElementBuilder = builder as ElementFromElementBuilder;
            let sourceElement = fromElementBuilder.element;
            if (sourceElement) {
                this.parentElement = fromElementBuilder.parentElement ? fromElementBuilder.parentElement : sourceElement.parentElement;
                if (this.parentElement) {
                    this.parentElement.replaceChildElement(this, sourceElement);
                }
                this.children = sourceElement.children;
                this.el = sourceElement.el;
            }
        } else if (ObjectHelper.iFrameSafeInstanceOf(builder, ElementFromHelperBuilder)) {
            let fromHelperBuilder = builder as ElementFromHelperBuilder;

            this.el = fromHelperBuilder.helper;
            if (fromHelperBuilder.loadExistingChildren) {
                this.loadExistingChildren();
            }
            if (fromHelperBuilder.parentElement) {
                this.parentElement = fromHelperBuilder.parentElement;
            }
        } else if (ObjectHelper.iFrameSafeInstanceOf(builder, NewElementBuilder)) {
            let newElementBuilder = builder as NewElementBuilder;
            if (!newElementBuilder.tagName) {
                throw new Error('tagName cannot be null');
            }
            if (newElementBuilder.helper) {
                this.el = newElementBuilder.helper;
            } else {
                this.el = ElementHelper.fromName(newElementBuilder.tagName);
            }

            if (newElementBuilder.parentElement) {
                this.parentElement = newElementBuilder.parentElement;
            }
        } else {
            throw new Error('Unsupported builder: ' + ClassHelper.getClassName(builder));
        }

        if (this.parentElement && this.el.getHTMLElement().parentElement) {
            if (!(this.parentElement.getHTMLElement() === this.el.getHTMLElement().parentElement)) {

                throw new Error('Illegal state: HTMLElement in parent Element is not the as the HTMLElement parent to this HTMLElement');
            }
        }
        // Do not generate id unless the distance to Element in the class hierarchy of this is larger than 1
        // This should result in that no id's are generated for new Element or classes extending Element directly
        // (which should prevent id-generation of direct instances of most dom classes)
        const distance = ClassHelper.distanceTo(this, Element);
        if (builder.generateId || distance > 1) {
            const id = ElementRegistry.registerElement(this);
            this.setId(id);

            this.onAdded(() => {
                // If element was removed and then added to DOM again we need to bring it back to ElementRegistry
                if (!ElementRegistry.getElementById(id)) {
                    ElementRegistry.reRegisterElement(this);
                }
            });

            this.onRemoved(() => {
                ElementRegistry.unregisterElement(this);
            });
        }

        if (builder.className) {
            this.setClass(builder.className);
        }
    }

    applyWCAGAttributes(attr?: WCAG): void {
        if (!ObjectHelper.isDefined(attr) && !this.implementsWCAG()) {
            return;
        }

        if (ObjectHelper.isDefined(attr)) {
            this[WCAG] = true;
            if (ObjectHelper.isDefined(attr.tabbable)) {
                this['tabbable'] = attr['tabbable'];
            }
            if (ObjectHelper.isDefined(attr.role)) {
                this['role'] = attr['role'];
            }
            if (ObjectHelper.isDefined(attr.ariaLabel)) {
                this['ariaLabel'] = attr['ariaLabel'];
            }
            if (ObjectHelper.isDefined(attr.ariaHasPopup)) {
                this['ariaHasPopup'] = attr['ariaHasPopup'];
            }
            if (ObjectHelper.isDefined(attr.ariaExpanded)) {
                this['ariaExpanded'] = attr['ariaExpanded'];
            }
            if (ObjectHelper.isDefined(attr.ariaHidden)) {
                this['ariaHidden'] = attr['ariaHidden'];
            }
        }

        if (ObjectHelper.isDefined(this['tabbable']) && this['tabbable']) {
            if (this.getEl().getTabIndex() !== -1) {
                this.makeTabbable();
            }
        } else {
            this.removeTabbable();
        }
        if (ObjectHelper.isDefined(this['role'])) {
            this.setRole(this['role']);
        }
        if (ObjectHelper.isDefined(this['ariaLabel'])) {
            this.setAriaLabel(this['ariaLabel']);
        }
        if (ObjectHelper.isDefined(this['ariaHasPopup'])) {
            this.setAriaHasPopup(this['ariaHasPopup']);
        }
        if (ObjectHelper.isDefined(this['ariaExpanded'])) {
            this.setAriaExpanded(this['ariaExpanded']);
        }
        if (ObjectHelper.isDefined(this['ariaHidden'])) {
            this.setAriaHidden(this['ariaHidden']);
        }
    }

    private implementsWCAG(): boolean {
        return this[WCAG] === true;
    }

    static fromHtmlElement(element: HTMLElement, loadExistingChildren: boolean = false, parent?: Element): Element {
        return new Element(
            new ElementFromHelperBuilder()
                .setHelper(new ElementHelper(element))
                .setLoadExistingChildren(loadExistingChildren)
                .setParentElement(parent)
        );
    }

    static fromString(s: string, loadExistingChildren: boolean = true): Element {
        const sanitizedHtml: string = DOMPurify.sanitize(s);
        return Element.fromHtml(sanitizedHtml, loadExistingChildren);
    }

    static fromCustomarilySanitizedString(s: string, loadExistingChildren: boolean = true, sanitizeConfig: PurifyConfig): Element {
        const sanitizedHtml: string = DOMPurify.sanitize(s, Element.createDOMPurifyConfig(sanitizeConfig));
        return Element.fromHtml(sanitizedHtml, loadExistingChildren);
    }

    private static createDOMPurifyConfig(purifyConfig?: PurifyConfig): DOMPurifyConfig  {
        const config: DOMPurifyConfig = {};

        if (purifyConfig.addTags) {
            config.ADD_TAGS = purifyConfig.addTags.slice();
        }

        if (purifyConfig.addAttributes) {
            config.ADD_ATTR = purifyConfig.addAttributes.slice();
        }

        return config;
    }

    static fromHtml(html: string, loadExistingChildren: boolean = true): Element {
        const htmlEl = $(html).get(0);

        if (!htmlEl) {
            return null;
        }

        let parentEl: Element;

        if (htmlEl && htmlEl.parentElement) {
            parentEl = Element.fromHtmlElement(htmlEl.parentElement);
        }

        return this.fromHtmlElement(htmlEl, loadExistingChildren, parentEl);
    }

    static fromSelector(s: string, loadExistingChildren: boolean = true): Element[] {
        return $(s).map((_index, elem) => {
            let htmlEl = elem;
            let parentEl;
            if (htmlEl && htmlEl.parentElement) {
                parentEl = Element.fromHtmlElement(htmlEl.parentElement);
            }
            return Element.fromHtmlElement(htmlEl, loadExistingChildren, parentEl);
        }).get();
    }

    public loadExistingChildren(): Element {

        let children = this.el.getChildren();
        for (const child of children) {
            const childAsElement = Element.fromHtmlElement(child as HTMLElement, true, this);
            this.children.push(childAsElement);
        }

        return this;
    }

    public findChildById(id: string, deep: boolean = false): Element {
        for (const child of this.children) {
            if (child.getId() === id) {
                return child;
            } else if (deep) {
                let found = child.findChildById(id, deep);
                if (found) {
                    return found;
                }
            }
        }
        return null;
    }

    /**
     * Renders the element,
     * then all its children,
     * and throws rendered event after that
     * @param deep tells if all the children should be rendered as well
     * @returns {Promise<boolean>}
     */
    render(deep: boolean = true): Q.Promise<boolean> {
        if (Element.debug) {
            console.log('Element.render started', ClassHelper.getClassName(this));
        }
        this.rendering = true;

        return this.doRender().then((rendered) => {

            let childPromises = [];
            if (deep) {
                this.children.forEach((child: Element) => {
                    childPromises.push(child.render(deep));
                });
            }
            return Q.all(childPromises).then(() => {
                if (Element.debug) {
                    console.log('Element.render done', ClassHelper.getClassName(this));
                }

                this.rendering = false;
                this.rendered = rendered;
                this.notifyRendered();

                return rendered;
            }).catch((reason) => {
                console.error(reason);
                return false;
            });
        });
    }

    isRendering(): boolean {
        return this.rendering;
    }

    isRendered(): boolean {
        return this.rendered;
    }

    isAdded(): boolean {
        return !!this.getHTMLElement().parentNode;
    }

    /**
     * Do all the element rendering here
     * Return false to tell that rendering failed
     * @returns {Q.Promise<boolean>}
     */
    doRender(): Q.Promise<boolean> {
        return Q(true);
    }

    show() {
        // Using jQuery to show, since it seems to contain some smartness
        $(this.el.getHTMLElement()).show();
        this.notifyShown(this, true);
    }

    hide(skipAnimation: boolean = false) {
        // Using jQuery to hide, since it seems to contain some smartness
        if (skipAnimation) {
            $(this.el.getHTMLElement()).hide(null);
        } else {
            $(this.el.getHTMLElement()).hide();
        }
        this.notifyHidden(this);
    }

    setVisible(value: boolean): Element {
        if (value) {
            this.show();
        } else {
            this.hide();
        }
        return this;
    }

    isVisible() {
        return this.el.isVisible();
    }

    isFocusable(): boolean {
        return this.isVisible() && !this.el.isDisabled();
    }

    getNextFocusable(): HTMLElement | undefined {
        const focusableElements = $(':focusable'); // Get all focusable elements
        const lastIndex = focusableElements.toArray().indexOf(this.getHTMLElement());

        if (lastIndex !== -1) {
            return focusableElements.get((lastIndex + 1) % focusableElements.length);
        }

        return undefined;
    }

    setTitle(title: string): Element {
        const trimmedTitle = title.trim();
        if (trimmedTitle) {
            this.el.setTitle(trimmedTitle);
            this.setAriaLabel(trimmedTitle);
        } else {
            this.el.removeAttribute('title');
            this.setAriaLabel('');
        }
        return this;
    }

    setClass(className: string): Element {
        assert(!StringHelper.isEmpty(className), 'Class name cannot be empty');
        this.el.setClass(className);
        return this;
    }

    setClassEx(className: string): Element {
        let cls = StyleHelper.getCls(className);
        return this.setClass(cls);
    }

    addClass(className: string): Element {
        assert(!StringHelper.isEmpty(className), 'Class name cannot be empty');
        this.el.addClass(className);
        return this;
    }

    addClassEx(className: string, prefix?: string): Element {
        let cls = StyleHelper.getCls(className, prefix);
        return this.addClass(cls);
    }

    toggleClass(className: string, condition?: boolean): Element {
        this.el.toggleClass(className, condition);
        return this;
    }

    toggleClassEx(className: string, condition?: boolean): Element {
        let cls = StyleHelper.getCls(className);
        return this.toggleClass(cls, condition);
    }

    hasClass(className: string): boolean {
        return this.el.hasClass(className);
    }

    hasClassEx(className: string): boolean {
        let cls = StyleHelper.getCls(className);
        return this.hasClass(cls);
    }

    removeClass(className: string): Element {
        assert(!StringHelper.isEmpty(className), 'Class name cannot be empty');
        this.el.removeClass(className);
        return this;
    }

    removeClassEx(className: string): Element {
        let cls = StyleHelper.getCls(className);
        return this.removeClass(cls);
    }

    getClass(): string {
        return this.el.getClass();
    }

    getId(): string {
        return this.el.getId();
    }

    setId(value: string): Element {
        this.el.setId(value);
        return this;
    }

    getEl(): ElementHelper {
        return this.el;
    }

    traverse(handler: (el: Element) => void) {
        this.getChildren().forEach((el: Element) => {
            handler(el);
            el.traverse(handler);
        });
    }

    setDraggable(value: boolean) {
        if (value) {
            this.getEl().setAttribute('draggable', value.toString());
        } else {
            this.getEl().removeAttribute('draggable');
        }
    }

    isDraggable(): boolean {
        return this.getEl().getAttribute('draggable') === 'true';
    }

    setContentEditable(flag: boolean): Element {
        this.getEl().setAttribute('contenteditable', flag ? 'true' : 'false');
        return this;
    }

    isContentEditable(): boolean {
        return this.getEl().getAttribute('contenteditable') === 'true';
    }

    setSpellcheck(value: boolean): Element {
        if (value) {
            this.getEl().setAttribute('spellcheck', 'true');
        } else {
            this.getEl().removeAttribute('spellcheck');
        }
        return this;
    }

    hasSpellcheck(): boolean {
        return this.getEl().hasAttribute('spellcheck');
    }

    makeTabbable(): Element {
        this.setTabIndex(0);
        return this;
    }

    removeTabbable(): Element {
        this.setTabIndex(-1);
        return this;
    }

    setTabIndex(tabIndex: number): Element {
        this.getEl().setTabIndex(tabIndex);
        return this;
    }

    setLang(value: string): Element {
        this.getEl().setAttribute('lang', value);
        return this;
    }

    getLang(): string {
        return this.getEl().getAttribute('lang');
    }

    private setAriaAttribute(name: string, value: string): Element {
        this.getEl().setAttribute(`aria-${name}`, value);
        return this;
    }

    private removeAriaAttribute(name: string): Element {
        this.getEl().removeAttribute(`aria-${name}`);
        return this;
    }

    setAriaLabel(label: string): Element {
        if (StringHelper.isBlank(label)) {
            this.removeAriaAttribute('label');
            return this;
        }
        return this.setAriaAttribute('label', label);
    }

    setAriaDisabled(disabled: boolean): Element {
        if (disabled) {
            return this.setAriaAttribute('disabled', 'true');
        }
        return this.removeAriaAttribute('disabled');
    }

    private isAriaRole(value: string | AriaRole): value is AriaRole {
        return Object.keys(AriaRole).some(key => (AriaRole as any)[key] === value);
    }

    private isAriaHasPopup(value: string | AriaHasPopup): value is AriaHasPopup {
        return Object.keys(AriaHasPopup).some(key => (AriaHasPopup as any)[key] === value);
    }

    setRole(value: string | AriaRole): Element {
        let role = AriaRole.NONE;
        if (this.isAriaRole(value)) {
            role = value;
        }
        if (StringHelper.isBlank(role.toLowerCase())) {
            this.getEl().removeAttribute('role');
        } else {
            this.getEl().setAttribute('role', role.toLowerCase());
        }

        return this;
    }

    setAriaHasPopup(value?: string | AriaHasPopup): Element {
        let hasPopup = value ?? AriaHasPopup.TRUE;
        if (this.isAriaHasPopup(value)) {
            hasPopup = value;
        }
        if (StringHelper.isBlank(hasPopup.toLowerCase())) {
            this.removeAriaAttribute('haspopup');
        } else {
            this.setAriaAttribute('haspopup', hasPopup.toLowerCase());
        }

        return this;
    }

    setAriaExpanded(value?: boolean): Element {
        if (!ObjectHelper.isDefined(value)) {
            this.removeAriaAttribute('expanded');
        }

        this.setAriaAttribute('expanded', String(value));

        return this;
    }

    setAriaHidden(value?: boolean): Element {
        if (!ObjectHelper.isDefined(value)) {
            this.removeAriaAttribute('hidden');
        }

        this.setAriaAttribute('hidden', String(value));

        return this;
    }

    setAriaSelected(): Element {
        this.setAriaAttribute('selected', 'true');

        return this;
    }

    removeAriaSelected(): Element {
        this.removeAriaAttribute('selected');

        return this;
    }

    setDir(value: LangDirection): Element {
        this.getEl().setAttribute('dir', value);
        return this;
    }

    getDir(): string {
        return this.getEl().getAttribute('dir');
    }

    giveFocus(): boolean {
        if (!this.isVisible()) {
            return false;
        }
        if (this.el.isDisabled()) {
            return false;
        }
        this.el.focus();
        let gotFocus: boolean = this.hasFocus();
        if (!gotFocus && Element.debug) {
            console.log('Element.giveFocus(): Failed to give focus to Element: class = ' + ClassHelper.getClassName(this) +
                        ', id = ' +
                        this.getId());
        }
        return gotFocus;
    }

    hasFocus(): boolean {
        return document.activeElement === this.el.getHTMLElement();
    }

    /*
     *      Child manipulations
     */

    giveBlur(): boolean {
        if (!this.isVisible()) {
            return false;
        }
        if (this.el.isDisabled()) {
            return false;
        }
        this.el.blur();
        let gotBlur: boolean = document.activeElement !== this.el.getHTMLElement();
        if (!gotBlur && Element.debug) {
            console.log('Element.giveBlur(): Failed to give blur to Element: class = ' + ClassHelper.getClassName(this) +
                        ', id = ' +
                        this.getId());
        }
        return gotBlur;
    }

    getHTMLElement(): HTMLElement {
        return this.el.getHTMLElement();
    }

    insertChild<T extends Element>(child: T, index: number): Element {
        assertNotNull(child, 'Child cannot be null');

        this.el.insertChild(child.getEl().getHTMLElement(), index);

        this.insertChildElement(child, this, index);
        return this;
    }

    appendChild<T extends Element>(child: T, lazyRender: boolean = false): Element {
        if (!lazyRender) {
            return this.insertChild(child, this.children.length);
        }

        return this.lazyRender(child);
    }

    appendChildren<T extends Element>(...children: T[]): Element {
        children.forEach((child: T) => {
            this.appendChild(child);
        });
        return this;
    }

    prependChild(child: Element): Element {
        return this.insertChild(child, 0);
    }

    insertAfterEl(existing: Element): Element {
        assertNotNull(existing, 'Existing element cannot be null');
        // get index before insertion !
        let existingIndex = existing.getSiblingIndex();
        this.el.insertAfterEl(existing.el);

        return this.insertChildElement(this, existing.parentElement, existingIndex + 1);
    }

    insertBeforeEl(existing: Element): Element {
        assertNotNull(existing, 'Existing element cannot be null');
        // get index before insertion !
        let existingIndex = existing.getSiblingIndex();
        this.el.insertBeforeEl(existing.el);

        return this.insertChildElement(this, existing.getParentElement(), existingIndex);
    }

    hasChild(child: Element): boolean {
        return this.children.indexOf(child) > -1;
    }

    hasParent(): boolean {
        return !!this.parentElement;
    }

    removeChild(child: Element): Element {
        assertNotNull(child, 'Child element to remove cannot be null');

        child.getEl().remove();
        this.removeChildElement(child);

        return this;
    }

    removeChildren(): Element {
        // iterate through copy of children array
        // because original array is changed when any child is deleted
        this.children.slice(0).forEach((child: Element) => {
            child.remove();
        });

        // remove text nodes etc
        this.el.setInnerHtml('');
        return this;
    }

    contains(element: Element) {
        return this.getEl().contains(element.getHTMLElement());
    }

    remove(): Element {
        if (this.parentElement) {
            this.parentElement.removeChild(this);
        } else {
            this.getEl().remove();
            this.notifyRemoved(null);
        }
        this.unDescendantAdded();
        return this;
    }

    /*
     *      Self actions
     */

    replaceWith(replacement: Element) {
        assertNotNull(replacement, 'replacement element cannot be null');

        // Do the actual DOM replacement
        replacement.el.insertAfterEl(this.el);
        replacement.notifyAdded();

        const parent = this.parentElement.getParentOf(this);
        if (!parent) {
            throw new Error('Source element is missing parent');
        }
        const childIndex = parent.children.indexOf(this);
        parent.unregisterChildElement(this);
        parent.registerChildElement(replacement, childIndex);

        // Run init of replacement if parent is rendered
        if (parent.isRendered()) {
            replacement.init();
        } else if (parent.isRendering()) {
            this.childrenAddedDuringInit = true;
        }

        // Remove this from DOM completely
        this.getEl().remove();
        this.notifyRemoved(parent, this);
    }

    wrapWithElement(wrapperElement: Element) {
        assertNotNull(wrapperElement, 'wrapperElement cannot be null');
        let parent = this.parentElement;
        if (!parent) {
            return;
        }

        this.replaceWith(wrapperElement);
        wrapperElement.appendChild(this);
    }

    getParentElement(): Element {
        return this.parentElement;
    }

    getChildren(): Element[] {
        return this.children;
    }

    getLastChild(): Element {
        return this.children[this.children.length - 1];
    }

    getFirstChild(): Element {
        return this.children[0];
    }

    getNextElement(): Element {
        let nextSiblingHtmlElement = this.getHTMLElement().nextElementSibling;
        if (!nextSiblingHtmlElement) {
            return null;
        }
        return Element.fromHtmlElement(nextSiblingHtmlElement as HTMLElement);
    }

    getPreviousElement(): Element {
        let previousSiblingHtmlElement = this.getHTMLElement().previousElementSibling;
        if (!previousSiblingHtmlElement) {
            return null;
        }
        return Element.fromHtmlElement(previousSiblingHtmlElement as HTMLElement);
    }

    /**
     * Returns the index of this element among it's siblings. Returns 0 if first or only child.
     */
    getSiblingIndex(): number {
        let indexFromDOM = this.el.getSiblingIndex();
        if (this.parentElement) {
            let indexFromElement = this.parentElement.children.indexOf(this);
            assertState(indexFromElement === indexFromDOM, 'index of Element in parentElement.children' +
                                                           ' [' + indexFromElement + '] does not correspond with' +
                                                           ' the actual index [' + indexFromDOM +
                                                           '] of the HTMLElement in DOM');
        }
        return indexFromDOM;
    }

    getTabbableElements(): Element[] {
        const selected = $(this.getHTMLElement()).find(':tabbable');
        const elements = [];

        for (const element of selected.toArray()) {
            elements.push(Element.fromHtmlElement(element));
        }

        return elements;

    }

    toString(): string {
        return $('<div>').append($(this.getHTMLElement()).clone()).html();
    }

    getHtml(): string {
        return this.getEl().getInnerHtml();
    }

    setHtml(value: string, escapeHtml: boolean = true): Element {
        this.getEl().setInnerHtml(value, escapeHtml);
        return this;
    }

    public isLazyRenderer() {
        return this.lazyRenderer;
    }

    public notifyLazyRendered() {
        this.lazyRenderedListeners.forEach(listener => {
            listener();
        });
        this.lazyRenderedListeners = [];
        if (!!this.parentElement) {
            this.parentElement.notifyLazyRendered();
        }
    }

    public onLazyRendered(listener: () => void) {

        if (this.containsLazyRenderers()) {
            this.lazyRenderedListeners.push(listener);
        } else {
            listener();
        }
    }

    public containsLazyRenderers(): boolean {
        if (this.isLazyRenderer()) {
            return true;
        }

        let result = false;

        this.traverse((el: Element) => {
            if (el.isLazyRenderer()) {
                result = true;
            }
        });

        return result;
    }

    public forceRender() {

        this.traverse((el: Element) => {
            if (!el.isLazyRenderer()) {
                return;
            }

            el.notifyForceRender();
        });
    }

    public notifyForceRender() {
        this.lazyRenderListeners.forEach(listener => {
            listener();
        });
    }

    onMouseEnter(handler: (e: MouseEvent) => any) {
        if (typeof this.getHTMLElement().onmouseenter !== 'undefined') {
            this.getEl().addEventListener('mouseenter', handler);
        } else {
            this.mouseEnterByHandler[handler as any] = (e: MouseEvent) => {
                // execute handler only if mouse came from outside
                if (!this.getEl().contains((e.relatedTarget || e['fromElement']) as HTMLElement)) {
                    handler(e);
                }
            };
            this.getEl().addEventListener('mouseover', this.mouseEnterByHandler[handler as any]);
        }
    }

    unMouseEnter(handler: (e: MouseEvent) => any) {
        if (typeof this.getHTMLElement().onmouseenter !== 'undefined') {
            this.getEl().removeEventListener('mouseenter', handler);
        } else {
            this.getEl().removeEventListener('mouseover', this.mouseEnterByHandler[handler as any]);
        }
    }

    onMouseLeave(handler: (e: MouseEvent) => any) {
        if (typeof this.getHTMLElement().onmouseleave !== 'undefined') {
            this.getEl().addEventListener('mouseleave', handler);
        } else {
            this.mouseLeaveByHandler[handler as any] = (e: MouseEvent) => {
                // execute handler only if mouse moves outside
                if (!this.getEl().contains((e.relatedTarget || e['toElement']) as HTMLElement)) {
                    handler(e);
                }
            };
            this.getEl().addEventListener('mouseout', this.mouseLeaveByHandler[handler as any]);
        }
    }

    unMouseLeave(handler: (e: MouseEvent) => any) {
        if (typeof this.getHTMLElement().onmouseleave !== 'undefined') {
            this.getEl().removeEventListener('mouseleave', handler);
        } else {
            this.getEl().removeEventListener('mouseout', this.mouseLeaveByHandler[handler as any]);
        }
    }

    onMouseOver(listener: (e: MouseEvent) => any) {
        this.getEl().addEventListener('mouseover', listener);
    }

    unMouseOver(listener: (event: MouseEvent) => void) {
        this.getEl().removeEventListener('mouseover', listener);
    }

    onMouseOut(listener: (e: MouseEvent) => any) {
        this.getEl().addEventListener('mouseout', listener);
    }

    unMouseOut(listener: (event: MouseEvent) => void) {
        this.getEl().removeEventListener('mouseout', listener);
    }

    onDescendantAdded(listener: (event: ElementEvent) => void) {
        this.descendantAddedListeners.push(listener);
    }

    unDescendantAdded() {
        this.descendantAddedListeners = [];
    }

    onAdded(listener: (event: ElementAddedEvent) => void) {
        this.addedListeners.push(listener);
    }

    unAdded(listener: (event: ElementAddedEvent) => void) {
        this.addedListeners = this.addedListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    onRemoved(listener: (event: ElementRemovedEvent) => void) {
        this.removedListeners.push(listener);
    }

    unRemoved(listener: (event: ElementRemovedEvent) => void) {
        this.removedListeners = this.removedListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    whenRendered(callback: () => void) {
        if (this.isRendered()) {
            callback();
        } else {
            const listener = () => {
                callback();
                this.unRendered(listener);
            };
            this.onRendered(listener);
        }
    }

    whenShown(callback: () => void) {
        if (this.isVisible()) {
            callback();
        } else {
            const listener = () => {
                callback();
                this.unShown(listener);
            };
            this.onShown(listener);
        }
    }

    onRendered(listener: (event: ElementRenderedEvent) => void) {
        this.renderedListeners.push(listener);
    }

    unRendered(listener: (event: ElementRenderedEvent) => void) {
        this.renderedListeners = this.renderedListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    onShown(listener: (event: ElementShownEvent) => void) {
        this.shownListeners.push(listener);
    }

    unShown(listener: (event: ElementShownEvent) => void) {
        this.shownListeners = this.shownListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    onHidden(listener: (event: ElementHiddenEvent) => void) {
        this.hiddenListeners.push(listener);
    }

    unHidden(listener: (event: ElementHiddenEvent) => void) {
        this.hiddenListeners = this.hiddenListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    onScrolled(listener: (event: WheelEvent) => void) {
        // IE9, Chrome, Safari, Opera
        this.onMouseWheel(listener);
        // Firefox
        this.getEl().addEventListener('DOMMouseScroll', listener);
    }

    unScrolled(listener: (event: WheelEvent) => void) {
        // IE9, Chrome, Safari, Opera
        this.unMouseWheel(listener);
        // Firefox
        this.getEl().removeEventListener('DOMMouseScroll', listener);
    }

    onApplyKeyPressed(callback: () => void) {
        const callbackWrapper = (event: KeyboardEvent) => {
            callback();
            event.stopPropagation();
            event.preventDefault();
        };
        this.onKeyDown((event: KeyboardEvent) => {
            if (KeyHelper.isEnterKey(event)) {
                callbackWrapper(event);
            }
        });

        this.onKeyUp((event: KeyboardEvent) => {
            if (KeyHelper.isSpace(event)) {
                callbackWrapper(event);
            }
        });
    }

    onEscPressed(callback: () => void) {
        this.onKeyDown((event: KeyboardEvent) => {
            if (KeyHelper.isEscKey(event)) {
                callback();
                event.stopPropagation();
                event.preventDefault();
            }
        });
    }

    onClicked(listener: (event: MouseEvent) => void) {
        this.getEl().addEventListener('click', listener);
    }

    unClicked(listener: (event: MouseEvent) => void) {
        this.getEl().removeEventListener('click', listener);
    }

    onDblClicked(listener: (event: MouseEvent) => void) {
        this.getEl().addEventListener('dblclick', listener);
    }

    unDblClicked(listener: (event: MouseEvent) => void) {
        this.getEl().removeEventListener('dblclick', listener);
    }

    onContextMenu(listener: (event: MouseEvent) => void) {
        this.getEl().addEventListener('contextmenu', listener);
    }

    unContextMenu(listener: (event: MouseEvent) => void) {
        this.getEl().removeEventListener('contextmenu', listener);
    }

    onMouseDown(listener: (event: MouseEvent) => void) {
        this.getEl().addEventListener('mousedown', listener);
    }

    unMouseDown(listener: (event: MouseEvent) => void) {
        this.getEl().removeEventListener('mousedown', listener);
    }

    onMouseUp(listener: (event: MouseEvent) => void) {
        this.getEl().addEventListener('mouseup', listener);
    }

    unMouseUp(listener: (event: MouseEvent) => void) {
        this.getEl().removeEventListener('mouseup', listener);
    }

    onMouseMove(listener: (event: MouseEvent) => void) {
        this.getEl().addEventListener('mousemove', listener);
    }

    unMouseMove(listener: (event: MouseEvent) => void) {
        this.getEl().removeEventListener('mousemove', listener);
    }

    onMouseWheel(listener: (event: WheelEvent) => void) {
        // http://www.javascriptkit.com/javatutors/onmousewheel.shtml
        // FF doesn't recognize mousewheel as of FF3.x
        let eventName = (/Firefox/i.test(navigator.userAgent)) ? 'wheel' : 'mousewheel';
        this.getEl().addEventListener(eventName, listener, true);
    }

    unMouseWheel(listener: (event: MouseEvent) => void) {
        let eventName = (/Firefox/i.test(navigator.userAgent)) ? 'wheel' : 'mousewheel';
        this.getEl().removeEventListener(eventName, listener);
    }

    onTouchStart(listener: (event: TouchEvent) => void, isPassive: boolean = true) {
        this.getEl().addEventListener('touchstart', listener, isPassive);
    }

    unTouchStart(listener: (event: TouchEvent) => void) {
        this.getEl().removeEventListener('touchstart', listener);
    }

    onTouchMove(listener: (event: TouchEvent) => void, isPassive: boolean = true) {
        this.getEl().addEventListener('touchmove', listener, isPassive);
    }

    unTouchMove(listener: (event: TouchEvent) => void) {
        this.getEl().removeEventListener('touchmove', listener);
    }

    onTouchEnd(listener: (event: TouchEvent) => void, isPassive: boolean = true) {
        this.getEl().addEventListener('touchend', listener, isPassive);
    }

    unTouchEnd(listener: (event: TouchEvent) => void) {
        this.getEl().removeEventListener('touchend', listener);
    }

    onKeyUp(listener: (event: KeyboardEvent) => void) {
        this.getEl().addEventListener('keyup', listener);
    }

    unKeyUp(listener: (event: KeyboardEvent) => void) {
        this.getEl().removeEventListener('keyup', listener);
    }

    onKeyDown(listener: (event: KeyboardEvent) => void) {
        this.getEl().addEventListener('keydown', listener);
    }

    unKeyDown(listener: (event: KeyboardEvent) => void) {
        this.getEl().removeEventListener('keydown', listener);
    }

    onKeyPressed(listener: (event: KeyboardEvent) => void) {
        this.getEl().addEventListener('keypress', listener);
    }

    unKeyPressed(listener: (event: KeyboardEvent) => void) {
        this.getEl().removeEventListener('keypress', listener);
    }

    onFocus(listener: (event: FocusEvent) => void) {
        this.getEl().addEventListener('focus', listener);
    }

    unFocus(listener: (event: FocusEvent) => void) {
        this.getEl().removeEventListener('focus', listener);
    }

    onBlur(listener: (event: FocusEvent) => void) {
        this.getEl().addEventListener('blur', listener);
    }

    unBlur(listener: (event: FocusEvent) => void) {
        this.getEl().removeEventListener('blur', listener);
    }

    onFocusIn(listener: (event: Event) => void) {
        this.getEl().addEventListener('focusin', listener);
    }

    unFocusIn(listener: (event: Event) => void) {
        this.getEl().removeEventListener('focusin', listener);
    }

    onFocusOut(listener: (event: Event) => void) {
        this.getEl().addEventListener('focusout', listener);
    }

    unFocusOut(listener: (event: Event) => void) {
        this.getEl().removeEventListener('focusout', listener);
    }

    onScroll(listener: (event: Event) => void) {
        this.getEl().addEventListener('scroll', listener);
    }

    unScroll(listener: (event: Event) => void) {
        this.getEl().removeEventListener('scroll', listener);
    }

    onDrag(listener: (event: DragEvent) => void) {
        this.getEl().addEventListener('drag', listener);
    }

    unDrag(listener: (event: DragEvent) => void) {
        this.getEl().removeEventListener('drag', listener);
    }

    onDragStart(listener: (event: DragEvent) => void) {
        this.getEl().addEventListener('dragstart', listener);
    }

    unDragStart(listener: (event: DragEvent) => void) {
        this.getEl().removeEventListener('dragstart', listener);
    }

    onDragEnter(listener: (event: DragEvent) => void) {
        this.getEl().addEventListener('dragenter', listener);
    }

    unDragEnter(listener: (event: DragEvent) => void) {
        this.getEl().removeEventListener('dragenter', listener);
    }

    onDragOver(listener: (event: DragEvent) => void) {
        this.getEl().addEventListener('dragover', listener);
    }

    unDragOver(listener: (event: DragEvent) => void) {
        this.getEl().removeEventListener('dragover', listener);
    }

    onDragOut(listener: (event: DragEvent) => void) {
        this.getEl().addEventListener('dragout', listener);
    }

    unDragOut(listener: (event: DragEvent) => void) {
        this.getEl().removeEventListener('dragout', listener);
    }

    // No native support of focusin/focusout events in Firefox yet.

    onDragLeave(listener: (event: DragEvent) => void) {
        this.getEl().addEventListener('dragleave', listener);
    }

    unDragLeave(listener: (event: DragEvent) => void) {
        this.getEl().removeEventListener('dragleave', listener);
    }

    onDrop(listener: (event: DragEvent) => void) {
        this.getEl().addEventListener('drop', listener);
    }

    unDrop(listener: (event: DragEvent) => void) {
        this.getEl().removeEventListener('drop', listener);
    }

    onDragEnd(listener: (event: DragEvent) => void) {
        this.getEl().addEventListener('dragend', listener);
    }

    unDragEnd(listener: (event: DragEvent) => void) {
        this.getEl().removeEventListener('dragend', listener);
    }

    /**
     * Inits element by rendering element first,
     * then all its children,
     * and then throwing the rendered (and shown) events
     * @returns {Promise<boolean>}
     */
    protected init(): Q.Promise<boolean> {
        if (Element.debug) {
            console.debug('Element.init started', ClassHelper.getClassName(this));
        }

        if (this.isVisible()) {
            this.notifyShown(this);
        }

        let renderPromise;
        if (this.isRendered() || this.isRendering()) {
            renderPromise = Q(true);
        } else {
            this.applyWCAGAttributes();
            renderPromise = this.doRender();
        }
        this.rendering = true;
        return renderPromise.then((rendered) => {

            return this.initChildren(rendered);
        }).catch((reason) => {
            console.error(reason);
            return false;
        });
    }

    private replaceChildElement(replacementChild: Element, existingChild: Element) {
        let index = this.children.indexOf(existingChild);
        this.children[index] = replacementChild;
    }

    private initChildren(rendered: boolean): Q.Promise<boolean> {
        this.childrenAddedDuringInit = false;
        let childPromises = [];

        this.children.forEach((child: Element) => {
            if (!child.isRendered()) {
                childPromises.push(child.init());
            }
        });

        return Q.all(childPromises).then(() => {

            if (this.childrenAddedDuringInit) {
                if (Element.debug) {
                    console.debug('Element.init: initing children that were added during init', ClassHelper.getClassName(this));
                }
                return this.initChildren(rendered);
            }

            if (Element.debug) {
                console.log('Element.init done', ClassHelper.getClassName(this));
            }

            this.rendering = false;
            this.rendered = rendered;
            this.notifyRendered();

            return rendered;
        }).catch((reason) => {
            console.error(reason);
            return false;
        });
    }

    private insertChildElement(child: Element, parent: Element, index?: number): Element {
        assertNotNull(child, 'Child element to insert cannot be null');
        assertNotNull(parent, 'Parent element cannot be null');

        parent.registerChildElement(child, index);

        if (parent.isRendered()) {
            child.init();
        } else if (parent.isRendering()) {
            this.childrenAddedDuringInit = true;
        }
        // notify added if I am added to dom only, otherwise do it on added to dom
        if (this.isAdded()) {
            child.notifyAdded();
        }
        return this;
    }

    private removeChildElement(child: Element): Element {
        assertNotNull(child, 'Child element to insert cannot be null');

        const parent: Element = this.unregisterChildElement(child);

        child.notifyRemoved(parent);
        return this;
    }

    private registerChildElement(child: Element, index?: number) {
        // first unregister element from parent if it has one
        // except when it equals to the one we're registering it in
        // that happens when parentElement has been set on Element in constructor, which is evil >:)
        // no need to do it with dom nodes because html takes care of this
        if (child.parentElement) {
            if (child.parentElement !== this) {
                child.parentElement.unregisterChildElement(child);
            } else if (this.children.indexOf(child) > -1) {
                // is already registered
                return;
            }
        }

        let parentNode = child.getHTMLElement().parentNode;
        // check for parentNode because if parent is not a HtmlElement but a Node ( i.e SVG )
        // then parentElement will be null but parentNode will not
        if (parentNode && parentNode !== this.getHTMLElement()) {
            throw new Error('Given child must be a child of this Element in DOM before it can be registered');
        }
        if (!index) {
            index = child.el.getSiblingIndex();
        }
        this.children.splice(index, 0, child);
        child.parentElement = this;
    }

    private getParentOf(targetChild: Element): Element {
        if (this.children.indexOf(targetChild) > -1) {
            return this;
        }

        for (const child of this.children) {
            const parent: Element = child.getParentOf(targetChild);
            if (parent) {
                return parent;
            }
        }

        return null;
    }

    private unregisterChildElement(child: Element): Element {
        if (!this.children?.length || !child.parentElement) {
            return null;
        }
        const parentElement = this.getParentOf(child);
        if (!parentElement) {
            return null;
        }
        const childIndex = parentElement.children.indexOf(child);
        parentElement.children.splice(childIndex, 1);
        child.parentElement = null;

        return parentElement;
    }

    private notifyDescendantAdded(e: ElementEvent) {
        this.descendantAddedListeners.forEach((listener) => {
            listener(e);
        });
        if (this.parentElement) {
            this.parentElement.notifyDescendantAdded(e);
        }
    }

    private isEmptyElement(): boolean {
        const rect = this.getEl().getBoundingClientRect();

        return (rect.height === 0 && rect.width === 0);
    }

    private getFirstNonEmptyAncestor(): Element {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        let el: Element = this;

        while (!!el && el.isEmptyElement()) {
            el = el.getParentElement();
        }

        return el;

    }

    private isInViewport(): boolean {
        const container = this.getFirstNonEmptyAncestor();

        if (!container || container.isEmptyElement()) {
            return false;
        }

        const rect = container.getEl().getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.top <= 2 * (window.innerHeight || document.documentElement.clientHeight) &&
            (rect.right - (window.innerWidth || document.documentElement.clientWidth)) <= 1 // small delta for calc inaccuracy
        );
    }

    private onForceRender(listener: () => void) {
        this.lazyRenderListeners.push(listener);
    }

    private unForceRender(listener: () => void) {
        this.lazyRenderListeners = this.lazyRenderListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    getScrollableParent(el?: Element): Element {
        const parent = (el || this).getParentElement();

        if (!parent) {
            return this;
        }

        if (parent.getEl().isScrollable()) {
            return parent;
        }

        return this.getScrollableParent(parent);
    }

    resolveDropdownPosition() {
        const container = this.getParentElement().getEl().getBoundingClientRect();
        const height = this.getEl().getHeightWithBorder();
        const parentHeight = this.getParentElement().getEl().getHeightWithBorder();

        const spaceToBottom = window.innerHeight - container.top - parentHeight;
        const spaceToTop = container.top;

        if (height > spaceToBottom && height <= spaceToTop) {
            this.getEl().setTop('auto').setBottomPx(parentHeight);
        } else {
            this.getEl().setBottom('auto').setTopPx(parentHeight);
        }
    }

    private lazyRender(childEl: Element): Element {
        const scrollableParent = this.getEl().scrollParent();
        const scrollableParentEl = Element.fromHtmlElement(scrollableParent);
        const $scrollableParent = $(scrollableParent);
        const hasNoScrollableParent = scrollableParent.nodeName.indexOf('document') > -1;

        if (hasNoScrollableParent || this.isInViewport()) {
            return this.appendChild(childEl);
        }

        this.lazyRenderer = true;

        const render = () => {
            const onAdded = () => {
                childEl.unAdded(onAdded);
                scrollableParentEl.unScroll(renderOnScroll);
                this.unForceRender(render);

                if (this.lazyRenderListeners.length === 0) {
                    this.lazyRenderer = false;
                    this.notifyLazyRendered();
                }
            };

            childEl.onAdded(onAdded);

            this.appendChild(childEl);
        };

        const renderOnScroll = () => {
            if (this.isInViewport()) {
                const lastScrollHeight = $scrollableParent.scrollTop();

                render();

                if (lastScrollHeight !== $scrollableParent.scrollTop()) {
                    $scrollableParent.scrollTop(lastScrollHeight);
                }
            }
        };

        scrollableParentEl.onScroll(renderOnScroll);
        this.onForceRender(render);

        return this;
    }

    private notifyAdded() {
        let addedEvent = new ElementAddedEvent(this);
        this.addedListeners.forEach((listener) => {
            listener(addedEvent);
        });

        if (this.parentElement) {
            const e = new ElementEvent('descendant-added', this, this.parentElement);
            this.parentElement.notifyDescendantAdded(e);
        }

        this.children.forEach((child: Element) => {
            child.notifyAdded();
        });
    }

    private notifyRemoved(parent: Element, target?: Element) {
        let removedEvent = new ElementRemovedEvent(this, parent, target);
        this.children.forEach((child: Element) => {
            child.notifyRemoved(removedEvent.getParent(), removedEvent.getTarget());
        });
        this.removedListeners.forEach((listener) => {
            listener(removedEvent);
        });
    }

    private notifyRendered() {
        let renderedEvent = new ElementRenderedEvent(this);
        this.renderedListeners.forEach((listener) => {
            listener(renderedEvent);
        });
        // Each child throw its own rendered
    }

    private notifyShown(target?: Element, deep?: boolean) {
        let shownEvent = new ElementShownEvent(this, target);
        this.shownListeners.forEach((listener) => {
            listener(shownEvent);
        });
        if (deep) {
            this.children.forEach((child: Element) => {
                if (child.isVisible()) {
                    child.notifyShown(shownEvent.getTarget(), deep);
                }
            });
        }
    }

    private notifyHidden(target?: Element) {
        let hiddenEvent = new ElementHiddenEvent(this, target);
        this.hiddenListeners.forEach((listener) => {
            listener(hiddenEvent);
        });
        this.children.forEach((child: Element) => {
            child.notifyHidden(hiddenEvent.getTarget());
        });
    }
}
