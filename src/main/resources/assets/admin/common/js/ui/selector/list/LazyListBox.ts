import {ListBox} from './ListBox';
import {Element} from '../../../dom/Element';

export class LazyListBox<T> extends ListBox<T> {

    private observer: IntersectionObserver;

    private observedItem: Element;

    private initIntersectionObserver(): void {
        this.observer = new IntersectionObserver((entries: IntersectionObserverEntry[]) => {
            entries.forEach((entry: IntersectionObserverEntry) => {
                if (entry.isIntersecting) {
                    this.handleLastItemIsVisible();
                }
            });
        }, this.initObserverOptions());
    }

    private initObserverOptions(): IntersectionObserverInit {
        return {
            root: this.getScrollContainer().getHTMLElement(),
            rootMargin: this.getRootMargin(),
            threshold: this.getThreshold()
        };
    }

    protected getRootMargin(): string {
        return '100px';
    }

    protected getThreshold(): number {
        return 0;
    }

    protected getScrollContainer(): Element {
        return this.getScrollableParent();
    }

    protected handleLastItemIsVisible(): void {
        this.observer.unobserve(this.observedItem.getHTMLElement());
        this.handleLazyLoad();
    }

    protected handleLazyLoad(): void {
        // must be implemented by subclasses
    }

    setItems(items: T[], silent?: boolean): void {
        super.setItems(items, silent);
        if (items.length > 0) {
            this.addLazyLoad();
        }
    }

    addItems(items: T[], silent: boolean = false): void {
        super.addItems(items, silent);
        if (items.length > 0) {
            this.addLazyLoad();
        }
    }

    private addLazyLoad(): void {
        const lastVisibleChild = this.getLastVisibleChild();
        if (!lastVisibleChild) {
            return;
        }

        if (!this.observer) {
            this.initIntersectionObserver();
        }

        this.addLazyLoadWhenLastIsVisible(lastVisibleChild);
    }

    protected getLastVisibleChild(): Element | undefined {
        return this.isVisible() ? [...this.getChildren()].reverse().find((item: Element) => item.isVisible()) : undefined;
    }

    protected addLazyLoadWhenLastIsVisible(itemView: Element): void {
        if (this.observedItem) {
            this.observer.unobserve(this.observedItem.getHTMLElement());
        }

        this.observedItem = itemView;
        this.observer.observe(itemView.getHTMLElement());
    }
}
