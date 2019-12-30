import * as Q from 'q';
import {BaseLoader} from './BaseLoader';

export class PostLoader<JSON, OBJECT>
    extends BaseLoader<JSON, OBJECT> {

    private isPostLoading: boolean = false;

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
            this.isPostLoading = true;
            this.load(true).finally(() => {
                this.isPostLoading = false;
            });
        }
    }
}
