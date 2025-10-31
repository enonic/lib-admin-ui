import {DivEl} from '../dom/DivEl';
import {Button} from '../ui/button/Button';
import {BucketView} from '../ui2/BucketView';
import {i18n} from '../util/Messages';

export class BucketsContainer
    extends DivEl {

    private showMoreButton: Button;

    private bucketsBlock: DivEl;

    private allShown: boolean;

    private static MAX_SHOWN_LIMIT: number = 5;

    constructor() {
        super('buckets-container');

        this.initElements();
        this.initListeners();
    }

    protected initElements(): void {
        this.bucketsBlock = new DivEl('buckets-views');
        this.showMoreButton = new Button(i18n('action.show.more'));
        this.showMoreButton.hide();
    }

    protected initListeners(): void {
        this.showMoreButton.onClicked(() => {
            this.allShown = !this.allShown;
            this.showMoreButton.setLabel(this.allShown ? i18n('action.show.less') : i18n('action.show.more'));
            this.updateVisibilityOfBuckets();
        });
    }

    private updateVisibilityOfBuckets(): void {
        this.bucketsBlock.getChildren().forEach(
            (bucketView: BucketView, index: number) => bucketView.setVisible(this.allShown || index < BucketsContainer.MAX_SHOWN_LIMIT));
    }

    addBucketView(bucketView: BucketView): void {
        bucketView.setVisible(this.allShown || this.bucketsBlock.getChildren().length < BucketsContainer.MAX_SHOWN_LIMIT);

        bucketView.onRemoved(() => {
            this.updateVisibilityOfBuckets();
        });

        this.bucketsBlock.appendChild(bucketView);
        this.showMoreButton.setVisible(this.bucketsBlock.getChildren().length > BucketsContainer.MAX_SHOWN_LIMIT);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.showMoreButton.addClass('show-more');
            this.appendChildren(this.bucketsBlock, this.showMoreButton);

            return rendered;
        });
    }
}
