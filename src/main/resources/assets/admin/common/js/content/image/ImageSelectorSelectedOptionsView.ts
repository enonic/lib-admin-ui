module api.content.image {

    import Option = api.ui.selector.Option;
    import SelectedOption = api.ui.selector.combobox.SelectedOption;
    import SelectedOptionEvent = api.ui.selector.combobox.SelectedOptionEvent;

    export class ImageSelectorSelectedOptionsView
        extends api.ui.selector.combobox.BaseSelectedOptionsView<ImageTreeSelectorItem> {

        private activeOption: SelectedOption<ImageTreeSelectorItem>;

        private selection: SelectedOption<ImageTreeSelectorItem>[] = [];

        private toolbar: SelectionToolbar;

        private editSelectedOptionsListeners: { (option: SelectedOption<ImageTreeSelectorItem>[]): void }[] = [];

        private removeSelectedOptionsListeners: { (option: SelectedOption<ImageTreeSelectorItem>[]): void }[] = [];

        private mouseClickListener: (event: MouseEvent) => void;

        private clickDisabled: boolean = false;

        readonly stickyToolbarCls: string = 'image-selector-toolbar-sticky';

        constructor() {
            super();

            this.setOccurrencesSortable(true);

            this.initAndAppendSelectionToolbar();

            this.addOptionMovedEventHandler();
        }

        private initAndAppendSelectionToolbar() {
            this.toolbar = new SelectionToolbar();
            this.toolbar.hide();
            this.toolbar.onEditClicked(() => {
                this.notifyEditSelectedOptions(this.selection);
            });
            this.toolbar.onRemoveClicked(() => {
                this.removeSelectedOptions(this.selection);
            });
            this.toolbar.onShown(() => this.updateStickyToolbar());
            this.toolbar.onHidden(() => this.toolbar.removeClass(this.stickyToolbarCls));
            this.onRendered(() => {
                this.toolbar.insertAfterEl(this);

                const scrollableParentEl = wemjq(this.getHTMLElement()).scrollParent()[0];
                const scrollableParent = api.dom.Element.fromHtmlElement(scrollableParentEl);

                scrollableParent.onScroll(() => this.updateStickyToolbar());
                api.ui.responsive.ResponsiveManager.onAvailableSizeChanged(this, () => this.updateStickyToolbar(true));
            });
        }

        private addOptionMovedEventHandler() {
            //when dragging selected image in chrome it looses focus; bringing focus back
            this.onOptionMoved((moved: SelectedOption<ImageTreeSelectorItem>) => {
                let selectedOptionMoved: boolean = moved.getOptionView().hasClass('editing');

                if (selectedOptionMoved) {
                    (<ImageSelectorSelectedOptionView>moved.getOptionView()).getCheckbox().giveFocus();
                }
            });
        }

        protected handleDnDStop(): void {
            this.temporarilyDisableClickEvent(); //FF triggers unwanted click event after dragging sortable
        }

        private temporarilyDisableClickEvent() {
            this.clickDisabled = true;
            setTimeout(() => this.clickDisabled = false, 50);
        }

        removeOption(optionToRemove: Option<ImageTreeSelectorItem>, silent: boolean = false) {
            const selectedOption = this.getByOption(optionToRemove);

            this.selection = this.selection.filter((option: SelectedOption<ImageTreeSelectorItem>) => {
                return option.getOption().value !== selectedOption.getOption().value;
            });

            this.updateSelectionToolbarLayout();

            super.removeOption(optionToRemove, silent);
        }

        removeSelectedOptions(options: SelectedOption<ImageTreeSelectorItem>[]) {
            this.notifyRemoveSelectedOptions(options);
            // clear the selection;
            this.selection.length = 0;
            this.updateSelectionToolbarLayout();
            this.resetActiveOption();
        }

        createSelectedOption(option: Option<ImageTreeSelectorItem>): SelectedOption<ImageTreeSelectorItem> {
            return new SelectedOption<ImageTreeSelectorItem>(new ImageSelectorSelectedOptionView(option), this.count());
        }

        addOption(option: Option<ImageTreeSelectorItem>, silent: boolean = false, keyCode: number = -1): boolean {
            const selectedOption = this.getByOption(option);
            if (!selectedOption) {
                this.addNewOption(option, silent, keyCode);
                return true;
            }

            const displayValue = selectedOption.getOption().displayValue;
            if (displayValue.getContentSummary() == null && option.displayValue.getContentSummary() != null) {
                this.updateUploadedOption(option);
                return true;
            }

            return false;
        }

        private addNewOption(option: Option<ImageTreeSelectorItem>, silent: boolean, keyCode: number = -1) {
            let selectedOption: SelectedOption<ImageTreeSelectorItem> = this.createSelectedOption(option);
            this.getSelectedOptions().push(selectedOption);

            let optionView: ImageSelectorSelectedOptionView = <ImageSelectorSelectedOptionView>selectedOption.getOptionView();

            optionView.onRendered(() => {
                this.handleOptionViewRendered(selectedOption, optionView);
                optionView.setOption(option);
            });
            this.appendChild(optionView);
            this.updateStickyToolbar();

            if (!silent) {
                this.notifyOptionSelected(new SelectedOptionEvent(selectedOption, keyCode));
            }
        }

        updateUploadedOption(option: Option<ImageTreeSelectorItem>) {
            let selectedOption = this.getByOption(option);
            let content = option.displayValue.getContentSummary();

            let newOption = <Option<ImageTreeSelectorItem>>{
                value: content.getId(),
                displayValue: new ImageTreeSelectorItem(content)
            };

            selectedOption.getOptionView().setOption(newOption);
        }

        makeEmptyOption(id: string): Option<ImageTreeSelectorItem> {
            return <Option<ImageTreeSelectorItem>>{
                value: id,
                displayValue: new ImageTreeSelectorItem(null).setDisplayValue(ImageSelectorDisplayValue.makeEmpty()),
                empty: true
            };
        }

        private uncheckOthers(option: SelectedOption<ImageTreeSelectorItem>) {
            let selectedOptions = this.getSelectedOptions();
            for (let i = 0; i < selectedOptions.length; i++) {
                let view = <ImageSelectorSelectedOptionView>selectedOptions[i].getOptionView();
                if (i !== option.getIndex()) {
                    view.getCheckbox().setChecked(false);
                }
            }
        }

        private removeOptionViewAndRefocus(option: SelectedOption<ImageTreeSelectorItem>) {
            let index = this.isLast(option.getIndex()) ? (this.isFirst(option.getIndex()) ? -1 : option.getIndex() - 1) : option.getIndex();

            this.notifyRemoveSelectedOptions([option]);
            this.resetActiveOption();

            if (index > -1) {
                (<ImageSelectorSelectedOptionView>this.getByIndex(index).getOptionView()).getCheckbox().giveFocus();
            }
        }

        private setActiveOption(option: SelectedOption<ImageTreeSelectorItem>) {

            if (this.activeOption) {
                this.activeOption.getOptionView().removeClass('editing');
            }
            this.activeOption = option;
            option.getOptionView().addClass('editing');

            this.setOutsideClickListener();
        }

        private updateSelectionToolbarLayout() {
            let showToolbar = this.selection.length > 0;
            this.toolbar.setVisible(showToolbar);
            if (showToolbar) {
                this.toolbar.setSelectionCount(this.selection.length, this.getNumberOfEditableOptions());
            }
        }

        private getNumberOfEditableOptions(): number {
            let count = 0;
            this.selection.forEach(selectedOption => {
                if (!selectedOption.getOption().displayValue.isEmptyContent()) {
                    count++;
                }
            });
            return count;
        }

        private resetActiveOption() {
            if (this.activeOption) {
                this.activeOption.getOptionView().removeClass('editing first-in-row last-in-row');
                this.activeOption = null;
            }

            api.dom.Body.get().unClicked(this.mouseClickListener);
        }

        private setOutsideClickListener() {
            this.mouseClickListener = (event: MouseEvent) => {
                for (let element = event.target; element; element = (<any>element).parentNode) {
                    if (element === this.getHTMLElement()) {
                        return;
                    }
                }
                this.resetActiveOption();
            };

            api.dom.Body.get().onClicked(this.mouseClickListener);
        }

        private handleOptionViewRendered(option: SelectedOption<ImageTreeSelectorItem>, optionView: ImageSelectorSelectedOptionView) {
            optionView.onClicked(() => this.handleOptionViewClicked(option, optionView));

            optionView.getCheckbox().onKeyDown((event: KeyboardEvent) => this.handleOptionViewKeyDownEvent(event, option, optionView));

            optionView.getCheckbox().onFocus(() => this.setActiveOption(option));

            optionView.onChecked(
                (_view: ImageSelectorSelectedOptionView, checked: boolean) => this.handleOptionViewChecked(checked, option, optionView));

            optionView.getIcon().onLoaded(() => this.handleOptionViewImageLoaded(optionView));

            if (option.getOption().displayValue.isEmptyContent()) {
                optionView.showError('No access to image.');
            }
        }

        private handleOptionViewClicked(option: SelectedOption<ImageTreeSelectorItem>, optionView: ImageSelectorSelectedOptionView) {
            if (this.clickDisabled) {
                return;
            }

            this.uncheckOthers(option);

            if (document.activeElement === optionView.getEl().getHTMLElement() || this.activeOption === option) {
                optionView.getCheckbox().toggleChecked();
            } else {
                optionView.getCheckbox().setChecked(true);
            }
            optionView.getCheckbox().giveFocus();
        }

        private handleOptionViewKeyDownEvent(event: KeyboardEvent, option: SelectedOption<ImageTreeSelectorItem>,
                                             optionView: ImageSelectorSelectedOptionView) {
            let checkbox = optionView.getCheckbox();

            switch (event.which) {
            case 32: // Spacebar
                checkbox.toggleChecked();
                event.stopPropagation();
                break;
            case 8: // Backspace
                checkbox.setChecked(false);
                this.removeOptionViewAndRefocus(option);
                event.preventDefault();
                event.stopPropagation();
                break;
            case 46: // Delete
                checkbox.setChecked(false);
                this.removeOptionViewAndRefocus(option);
                event.stopPropagation();
                break;
            case 13: // Enter
                this.notifyEditSelectedOptions([option]);
                event.stopPropagation();
                break;
            case 9: // tab
                this.resetActiveOption();
                event.stopPropagation();
                break;
            }
        }

        private handleOptionViewChecked(checked: boolean, option: SelectedOption<ImageTreeSelectorItem>,
                                        optionView: ImageSelectorSelectedOptionView) {
            if (checked) {
                if (this.selection.indexOf(option) < 0) {
                    this.selection.push(option);
                }
            } else {
                let index = this.selection.indexOf(option);
                if (index > -1) {
                    this.selection.splice(index, 1);
                }
            }
            optionView.getCheckbox().giveFocus();
            this.updateSelectionToolbarLayout();
        }

        private handleOptionViewImageLoaded(optionView: ImageSelectorSelectedOptionView) {
            let loadedListener = () => {
                optionView.updateProportions();
                this.refreshSortable();
            };

            if (optionView.getIcon().isVisible()) {
                loadedListener();
            } else {
                // execute listener on shown in case it's hidden now to correctly calc proportions
                let shownListener = () => {
                    loadedListener();
                    optionView.getIcon().unShown(shownListener);
                };
                optionView.getIcon().onShown(shownListener);
            }
        }

        private isFirst(index: number): boolean {
            return index === 0;
        }

        private isLast(index: number): boolean {
            return index === this.getSelectedOptions().length - 1;
        }

        private unstickOtherToolbars() {
            wemjq('.' + this.stickyToolbarCls).removeClass(this.stickyToolbarCls);
        }

        updateStickyToolbar(afterResize: boolean = false) {
            if (!this.toolbar.isVisible()) {
                return;
            }
            const selectedOptionsViewRect = this.getHTMLElement().getBoundingClientRect();
            const windowHeight = (window.innerHeight || document.documentElement.clientHeight);

            if (this.toolbar.hasClass(this.stickyToolbarCls)) {
                const toolbarHeight = this.toolbar.getEl().getHeightWithBorder();

                if (selectedOptionsViewRect.bottom + toolbarHeight <= windowHeight ||
                    selectedOptionsViewRect.top + 10 >= windowHeight) {
                    this.toolbar.removeClass(this.stickyToolbarCls);
                    this.toolbar.getEl().setWidth('100%');
                } else if (afterResize) {
                    this.toolbar.getEl().setWidthPx(this.getEl().getWidth());
                }
            } else {

                const toolbarRect = this.toolbar.getHTMLElement().getBoundingClientRect();

                if (toolbarRect.bottom > windowHeight &&
                    selectedOptionsViewRect.top + 10 < windowHeight) {
                    this.unstickOtherToolbars();
                    this.toolbar.addClass(this.stickyToolbarCls);
                    this.toolbar.getEl().setWidthPx(this.getEl().getWidth());
                }
            }
        }

        private notifyRemoveSelectedOptions(option: SelectedOption<ImageTreeSelectorItem>[]) {
            this.removeSelectedOptionsListeners.forEach((listener) => {
                listener(option);
            });
        }

        onRemoveSelectedOptions(listener: (option: SelectedOption<ImageTreeSelectorItem>[]) => void) {
            this.removeSelectedOptionsListeners.push(listener);
        }

        unRemoveSelectedOptions(listener: (option: SelectedOption<ImageTreeSelectorItem>[]) => void) {
            this.removeSelectedOptionsListeners = this.removeSelectedOptionsListeners
                .filter(function (curr: (option: SelectedOption<ImageTreeSelectorItem>[]) => void) {
                    return curr !== listener;
                });
        }

        private notifyEditSelectedOptions(option: SelectedOption<ImageTreeSelectorItem>[]) {
            this.editSelectedOptionsListeners.forEach((listener) => {
                listener(option);
            });
        }

        onEditSelectedOptions(listener: (option: SelectedOption<ImageTreeSelectorItem>[]) => void) {
            this.editSelectedOptionsListeners.push(listener);
        }

        unEditSelectedOptions(listener: (option: SelectedOption<ImageTreeSelectorItem>[]) => void) {
            this.editSelectedOptionsListeners = this.editSelectedOptionsListeners
                .filter(function (curr: (option: SelectedOption<ImageTreeSelectorItem>[]) => void) {
                    return curr !== listener;
                });
        }

    }

}
