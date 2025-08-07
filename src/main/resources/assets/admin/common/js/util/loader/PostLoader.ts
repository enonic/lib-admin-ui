import Q from 'q';
import {BaseLoader} from './BaseLoader';

export class PostLoader<OBJECT>
    extends BaseLoader<OBJECT> {

    private isPostLoading: boolean = false;

    load(postLoad: boolean = false): Q.Promise<OBJECT[]> {
        this.isPostLoading = postLoad;

        return super.load(postLoad);
    }

    sendRequest(): Q.Promise<OBJECT[]> {
        if (!this.isPostLoading) {
            this.resetParams();
        }
        return super.sendRequest();
    }

    resetParams() {
        //
    }

    isPartiallyLoaded(): boolean {
        return true;
    }

    postLoad() {
        // already have elements and not more than total
        if (this.isPartiallyLoaded() && this.isLoaded()) {
            this.load(true)
                .finally(() => {
                    this.isPostLoading = false;
                });
        }
    }
}
