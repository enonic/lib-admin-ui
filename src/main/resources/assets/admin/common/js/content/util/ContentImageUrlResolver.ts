module api.content.util {

    declare var CONFIG;
    export class ContentImageUrlResolver extends api.icon.IconUrlResolver {

        private contentId: ContentId;

        private size: string = '';

        private ts: string = null;

        private source: string = null; // parameter states if the source image should be used (without source cropping)

        private scale: string = null; //scale params applied to image

        setContentId(value: ContentId): ContentImageUrlResolver {
            this.contentId = value;
            return this;
        }

        setSize(value: number): ContentImageUrlResolver {
            this.size = '' + Math.floor(value);
            return this;
        }

        setWidth(value: string): ContentImageUrlResolver {
            this.size = value;
            return this;
        }

        setTimestamp(value: Date): ContentImageUrlResolver {
            this.ts = '' + value.getTime();
            return this;
        }

        setSource(value: boolean): ContentImageUrlResolver {
            this.source = '' + value;
            return this;
        }

        setScale(value: string): ContentImageUrlResolver {
            if (value) {
                this.scale = '' + value;
            }
            return this;
        }

        resolve(): string {

            let url = 'content/image/' + this.contentId.toString();
            url = this.appendParam('scaleWidth', 'true', url);
            if (this.size.length > 0) {
                url = this.appendParam('size', this.size, url);
            }
            if (this.ts) {
                url = this.appendParam('ts', this.ts, url);
            }
            if (this.source) {
                url = this.appendParam('source', this.source, url);
            }
            if (this.scale) {
                url = this.appendParam('scale', this.scale, url);
            }

            return api.util.UriHelper.getRestUri(url);
        }

        generate(): string {

            let url = this.appendParam('id', this.contentId.toString(), CONFIG.imagePreviewUrl);

            if (this.scale) {
                url = this.appendParam('scale', this.scale, url);
            }

            if (this.size) {
                url = this.appendParam('width', this.size, url);
            }

            return url;
        }
    }
}
