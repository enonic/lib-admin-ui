import {SpanEl} from '../../dom/SpanEl';
import {LiEl} from '../../dom/LiEl';
import {NavigationItem} from '../NavigationItem';
import {AEl} from '../../dom/AEl';
import {Action} from '../Action';
import {ActionButton} from '../button/ActionButton';
import {StringHelper} from '../../util/StringHelper';
import {Tooltip} from '../Tooltip';
import {TabItemLabelChangedEvent} from './TabItemLabelChangedEvent';
import {TabItemClosedEvent} from './TabItemClosedEvent';
import {TabItemSelectedEvent} from './TabItemSelectedEvent';

export class TabItem
    extends LiEl
    implements NavigationItem {

    static tabIndexFormat: string = '{0}. ';
    private index: number;
    private label: string;
    private labelEl: AEl;
    private active: boolean = false;
    private closeAction: Action;
    private removeButton: ActionButton;
    private labelChangedListeners: ((event: TabItemLabelChangedEvent) => void)[] = [];
    private closedListeners: ((event: TabItemClosedEvent) => void)[] = [];
    private selectedListeners: ((event: TabItemSelectedEvent) => void)[] = [];
    private indexEl: SpanEl;

    constructor(builder: TabItemBuilder, classes?: string) {

        super('tab-item' + (!classes ? '' : ' ' + classes));

        this.labelEl = new AEl('label');
        this.appendChild(this.labelEl);

        this.setLabel(builder.label, builder.markUnnamed, builder.addLabelTitleAttribute);

        this.markInvalid(builder.markInvalid);

        this.closeAction = builder.closeAction;

        if (builder.closeButtonEnabled) {
            this.createRemoveButton();
        }

        if (!builder.focusable) {
            this.setFocusable(false);
        }

        const handler = builder.clickHandler || (() => this.select());

        this.onClicked(handler);
        this.onTouchStart(handler);
    }

    numerate(index: number) {
        this.unnumerate();
        this.indexEl = new SpanEl('tab-item-index');
        this.indexEl.setHtml(StringHelper.format(TabItem.tabIndexFormat, index));
        this.insertChild(this.indexEl, 0);
    }

    unnumerate() {
        if (!this.indexEl) {
            return;
        }

        this.removeChild(this.indexEl);
        this.indexEl = null;
    }

    select() {
        this.notifySelectedListeners();
    }

    setIndex(value: number) {
        this.index = value;
    }

    getIndex(): number {
        return this.index;
    }

    setLabel(newValue: string, markUnnamed: boolean = false, addLabelTitleAttribute: boolean = true) {
        if (this.label === newValue) {
            return;
        }

        let oldValue = this.label;
        this.label = newValue;

        this.labelEl.setHtml(newValue);

        if (addLabelTitleAttribute) {
            this.getEl().setAttribute('title', newValue);
        }

        this.labelEl.toggleClass('unnamed', markUnnamed);

        this.notifyLabelChangedListeners(newValue, oldValue);
    }

    markInvalid(markInvalid: boolean = false) {
        this.toggleClass('invalid', markInvalid);
    }

    getLabel(): string {
        return this.label;
    }

    getFullLabel(): string {
        if (!this.indexEl) {
            return this.label;
        }
        return this.getHTMLElement().innerText;
    }

    setActive(value: boolean) {
        this.active = value;
        this.toggleClass('active', value);
    }

    isActive(): boolean {
        return this.active;
    }

    getCloseAction(): Action {
        return this.closeAction;
    }

    setCloseAction(closeAction: Action) {
        this.closeAction = closeAction;
    }

    onLabelChanged(listener: (event: TabItemLabelChangedEvent) => void) {
        this.labelChangedListeners.push(listener);
    }

    onSelected(listener: (event: TabItemSelectedEvent) => void) {
        this.selectedListeners.push(listener);
    }

    onClosed(listener: (event: TabItemClosedEvent) => void) {
        if (this.closeAction) {
            throw new Error('Failed to set \'on closed\' listener. Close action is already setted.');
        } else {
            this.closedListeners.push(listener);
        }
    }

    unLabelChanged(listener: (event: TabItemLabelChangedEvent) => void) {
        this.labelChangedListeners =
            this.labelChangedListeners.filter((currentListener: (event: TabItemLabelChangedEvent) => void) => {
                return listener !== currentListener;
            });
    }

    unSelected(listener: (event: TabItemSelectedEvent) => void) {
        this.selectedListeners = this.selectedListeners.filter((currentListener: (event: TabItemSelectedEvent) => void) => {
            return listener !== currentListener;
        });
    }

    unClosed(listener: (event: TabItemClosedEvent) => void) {
        this.closedListeners = this.closedListeners.filter((currentListener: (event: TabItemClosedEvent) => void) => {
            return listener !== currentListener;
        });
    }

    giveFocus(): boolean {
        return this.labelEl.giveFocus();
    }

    private createRemoveButton() {
        if (this.closeAction && !this.removeButton) {

            this.removeButton = new ActionButton(this.closeAction);
            this.removeButton.getTooltip().setSide(Tooltip.SIDE_LEFT);
            this.removeButton.onClicked((event: MouseEvent) => {
                event.stopPropagation();
                event.preventDefault();
            });
            this.prependChild(this.removeButton);
        }
    }

    private notifyLabelChangedListeners(newValue: string, oldValue: string) {
        this.labelChangedListeners.forEach((listener: (event: TabItemLabelChangedEvent) => void) => {
            listener.call(this, new TabItemLabelChangedEvent(this, oldValue, newValue));
        });
    }

    private notifySelectedListeners() {
        this.selectedListeners.forEach((listener: (event: TabItemSelectedEvent) => void) => {
            listener.call(this, new TabItemSelectedEvent(this));
        });
    }

    private setFocusable(focusable: boolean) {
        if (focusable) {
            this.labelEl.getEl().removeAttribute('tabindex');
        } else {
            this.labelEl.getEl().setAttribute('tabindex', '-1');
        }
    }

}

export class TabItemBuilder {

    label: string;

    addLabelTitleAttribute: boolean = true;

    closeAction: Action;

    closeButtonEnabled: boolean;

    markUnnamed: boolean;

    markInvalid: boolean;

    focusable: boolean = true;

    clickHandler: () => void;

    setLabel(label: string): TabItemBuilder {
        this.label = label;
        return this;
    }

    setCloseAction(closeAction: Action): TabItemBuilder {
        this.closeAction = closeAction;
        return this;
    }

    setCloseButtonEnabled(enabled: boolean): TabItemBuilder {
        this.closeButtonEnabled = enabled;
        return this;
    }

    setMarkUnnamed(markUnnamed: boolean): TabItemBuilder {
        this.markUnnamed = markUnnamed;
        return this;
    }

    setMarkInvalid(markInvalid: boolean): TabItemBuilder {
        this.markInvalid = markInvalid;
        return this;
    }

    setAddLabelTitleAttribute(addLabelTitleAttribute: boolean): TabItemBuilder {
        this.addLabelTitleAttribute = addLabelTitleAttribute;
        return this;
    }

    setFocusable(focusable: boolean): TabItemBuilder {
        this.focusable = focusable;
        return this;
    }

    setClickHandler(handler: () => void) {
        this.clickHandler = handler;
        return this;
    }

    build(): TabItem {
        return new TabItem(this);
    }

}
