module api.util.htmlarea.editor {
    import ImageModalDialog = api.util.htmlarea.dialog.ImageModalDialog;
    import StringHelper = api.util.StringHelper;

    export class HTMLAreaHelperCKE {

        private static getConvertedImageSrc(imgSrc: string): string {
            let contentId = HTMLAreaHelperCKE.extractContentIdFromImgSrc(imgSrc);
            let scaleValue = HTMLAreaHelperCKE.extractScaleParamFromImgSrc(imgSrc);
            let imageUrl = new api.content.util.ContentImageUrlResolver().setContentId(new api.content.ContentId(contentId)).setScaleWidth(
                true).setScale(scaleValue).setSize(ImageModalDialog.maxImageWidth).resolve();

            return ` src="${imageUrl}" data-src="${imgSrc}"`;
        }

        private static extractContentIdFromImgSrc(imgSrc: string): string {
            if (imgSrc.indexOf('?') !== -1) {
                return StringHelper.substringBetween(imgSrc, ImageModalDialog.imagePrefix, '?');
            }

            return imgSrc.replace(ImageModalDialog.imagePrefix, StringHelper.EMPTY_STRING);
        }

        private static extractScaleParamFromImgSrc(imgSrc: string): string {
            if (imgSrc.indexOf('scale=') !== -1) {
                return api.util.UriHelper.decodeUrlParams(imgSrc.replace('&amp;', '&'))['scale'];
            }

            return null;
        }

        public static prepareImgSrcsInValueForEdit(value: string): string {
            let processedContent = value;
            let regex = /<img.*?src="(.*?)"/g;
            let imgSrcs;

            if (!processedContent) {
                return '';
            }

            while (processedContent.search(` src="${ImageModalDialog.imagePrefix}`) > -1) {
                imgSrcs = regex.exec(processedContent);
                if (imgSrcs) {
                    imgSrcs.forEach((imgSrc: string) => {
                        if (imgSrc.indexOf(ImageModalDialog.imagePrefix) === 0) {
                            processedContent =
                                processedContent.replace(` src="${imgSrc}"`, HTMLAreaHelperCKE.getConvertedImageSrc(imgSrc));
                        }
                    });
                }
            }
            return processedContent;
        }

        public static prepareEditorImageSrcsBeforeSave(editorContent: string): string {
            const regex: RegExp = /<img.*?data-src="(.*?)".*?>/g;
            let processedContent: string = editorContent;

            AppHelper.whileTruthy(() => regex.exec(editorContent), (imgTags) => {
                const imgTag = imgTags[0];

                if (imgTag.indexOf('<img ') === 0 && imgTag.indexOf(ImageModalDialog.imagePrefix) > 0) {
                    const dataSrc = /<img.*?data-src="(.*?)".*?>/.exec(imgTag)[1];
                    const src = /<img.*?src="(.*?)".*?>/.exec(imgTags[0])[1];

                    const convertedImg = imgTag.replace(src, dataSrc).replace(` data-src="${dataSrc}"`,
                        StringHelper.EMPTY_STRING);
                    processedContent = processedContent.replace(imgTag, convertedImg);
                }
            });

            return processedContent;
        }
    }
}
