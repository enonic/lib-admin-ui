import {ListBox} from './ListBox';
import {Element} from '../../../dom/Element';

export class LazyListBox<T> extends ListBox<T> {

    private scrollContainer: Element;

    private observer: IntersectionObserver;

    private observedItem: Element;

    constructor(scrollContainer: Element, classname?: string) {
        super(classname);

        this.scrollContainer = scrollContainer;
        this.initIntersectionObserver();
    }

    private initIntersectionObserver(): void {
        this.observer = new IntersectionObserver((entries: IntersectionObserverEntry[]) => {
            entries.forEach((entry: IntersectionObserverEntry) => {
                if (entry.isIntersecting) {
                    this.handleLastItemIsVisible();
                }
            });
        }, this.initObserverOptions());
    }

    protected initObserverOptions(): IntersectionObserverInit {
        return {
            root: this.scrollContainer.getHTMLElement(),
            rootMargin: '100px',
            threshold: 0
        };
    }

    protected handleLastItemIsVisible(): void {
        this.observer.unobserve(this.observedItem.getHTMLElement());
        this.handleLazyLoad();
    }

    protected handleLazyLoad(): void {
    //
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
        if (this.getItemCount() > 0) {
            this.addLazyLoadWhenLastIsVisible(this.getLastChild());
        }
    }

    protected addLazyLoadWhenLastIsVisible(itemView: Element): void {
        if (this.observedItem) {
            this.observer.unobserve(this.observedItem.getHTMLElement());
        }

        this.observedItem = itemView;
        this.observer.observe(itemView.getHTMLElement());
    }
}
