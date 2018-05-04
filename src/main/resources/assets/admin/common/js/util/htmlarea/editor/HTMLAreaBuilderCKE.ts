module api.util.htmlarea.editor {

    import HTMLAreaEditor = CKEDITOR.editor;
    import eventInfo = CKEDITOR.eventInfo;

    export class HTMLAreaBuilderCKE {

        private content: api.content.ContentSummary; // used for image dialog
        private contentPath: api.content.ContentPath; // used for macro dialog
        private applicationKeys: ApplicationKey[]; // used for macro dialog

        private assetsUri: string;
        private editorContainerId: string;
        private focusHandler: (e: FocusEvent) => void;
        private blurHandler: (e: FocusEvent) => void;
        private keydownHandler: (e: eventInfo) => void;
        private nodeChangeHandler: (e: any) => void;
        private createDialogListeners: { (event: CreateHtmlAreaDialogEvent): void }[] = [];
        private inline: boolean = false;
        private fixedToolbarContainer: string;
        private hasActiveDialog: boolean = false;
        private customToolConfig: any;
        private editableSourceCode: boolean;
        private toolsToExlcude: string = '';
        private toolsToInclude: string[] = [];

        private tools: any[] = [
            ['Format', 'Bold', 'Italic', 'Underline', 'Strike', 'Subscript', 'Superscript', 'Code', 'Blockquote'],
            ['JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock'],
            ['BulletedList', 'NumberedList', 'Outdent', 'Indent'],
            ['SpecialChar', 'Anchor', 'Image', 'Macro', 'Link', 'Unlink'],
            ['Table', 'Maximize']
        ];

        private plugins: string = 'autogrow,sourcedialog,macro,image2,codeTag';

        setEditableSourceCode(value: boolean): HTMLAreaBuilderCKE {
            this.editableSourceCode = value;
            return this;
        }

        setAssetsUri(assetsUri: string): HTMLAreaBuilderCKE {
            this.assetsUri = assetsUri;
            return this;
        }

        setEditorContainerId(id: string): HTMLAreaBuilderCKE {
            this.editorContainerId = id;
            return this;
        }

        onCreateDialog(listener: (event: CreateHtmlAreaDialogEvent) => void) {
            this.createDialogListeners.push(listener);
            return this;
        }

        unCreateDialog(listener: (event: CreateHtmlAreaDialogEvent) => void) {
            this.createDialogListeners = this.createDialogListeners.filter((curr) => {
                return curr !== listener;
            });
            return this;
        }

        private notifyCreateDialog(event: CreateHtmlAreaDialogEvent) {
            this.createDialogListeners.forEach((listener) => {
                listener(event);
            });
        }

        setFocusHandler(focusHandler: (e: FocusEvent) => void): HTMLAreaBuilderCKE {
            this.focusHandler = focusHandler;
            return this;
        }

        setBlurHandler(blurHandler: (e: FocusEvent) => void): HTMLAreaBuilderCKE {
            this.blurHandler = blurHandler;
            return this;
        }

        setKeydownHandler(keydownHandler: (e: eventInfo) => void): HTMLAreaBuilderCKE {
            this.keydownHandler = keydownHandler;
            return this;
        }

        setNodeChangeHandler(nodeChangeHandler: (e: any) => void): HTMLAreaBuilderCKE {
            this.nodeChangeHandler = api.util.AppHelper.debounce((e) => {
                nodeChangeHandler(e);
            }, 200);

            return this;
        }

        setInline(inline: boolean): HTMLAreaBuilderCKE {
            this.inline = inline;
            return this;
        }

        setFixedToolbarContainer(fixedToolbarContainer: string): HTMLAreaBuilderCKE {
            this.fixedToolbarContainer = fixedToolbarContainer;
            return this;
        }

        setContent(content: api.content.ContentSummary): HTMLAreaBuilderCKE {
            this.content = content;
            return this;
        }

        setContentPath(contentPath: api.content.ContentPath): HTMLAreaBuilderCKE {
            this.contentPath = contentPath;
            return this;
        }

        setApplicationKeys(applicationKeys: ApplicationKey[]): HTMLAreaBuilderCKE {
            this.applicationKeys = applicationKeys;
            return this;
        }

        private includeTools(tools: any[]) {
            tools.forEach((tool: any) => {
                this.includeTool(tool);
            });
        }

        private includeTool(tool: string) {
            this.toolsToInclude.push(tool);
        }

        setTools(tools: any): HTMLAreaBuilderCKE {
            this.customToolConfig = tools;

            if (tools['exclude'] && tools['exclude'] instanceof Array) {
                this.toolsToExlcude = tools['exclude'].map(tool => tool.value).join().replace(/\s+/g, ',');
                if (this.toolsToExlcude === '*') {
                    this.tools = [];
                }
            }

            if (tools['include'] && tools['include'] instanceof Array) {
                this.includeTools(tools['include'].map(tool => tool.value).join().replace(/\|/g, '-').split(/\s+/));
            }

            return this;
        }

        private checkRequiredFieldsAreSet() {
            if (!this.assetsUri || !this.editorContainerId || !this.content) {
                throw new Error('some required fields are missing for CKEditor');
            }
        }

        public createEditor(): HTMLAreaEditor {
            this.checkRequiredFieldsAreSet();
            this.adjustToolsList();

            const config: CKEDITOR.config = this.createConfig();
            const ckeditor: HTMLAreaEditor = this.inline ? CKEDITOR.inline(this.editorContainerId, config) : CKEDITOR.replace(
                this.editorContainerId, config);

            this.listenCKEditorEvents(ckeditor);
            this.setupDialogsToOpen(ckeditor);

            return ckeditor;
        }

        private adjustToolsList() {
            if (this.editableSourceCode && !this.isToolExcluded('Code')) {
                this.includeTool('Sourcedialog');
            }

            this.tools.push(this.toolsToInclude);
        }

        private createConfig(): CKEDITOR.config {
            return {
                toolbar: this.tools,
                removePlugins: 'resize',
                removeButtons: this.toolsToExlcude,
                extraPlugins: this.plugins + (this.inline ? ',sharedspace' : ''),
                extraAllowedContent: 'code',
                format_tags: 'p;h1;h2;h3;h4;h5;h6;pre;div',
                autoGrow_onStartup: true,
                image2_disableResizer: true,
                disallowedContent: 'img[width,height]',
                uploadUrl: api.util.UriHelper.getRestUri('content/createMedia'),
                contentsCss: this.assetsUri + '/admin/common/styles/html-editor.css', // for classic mode only
                sharedSpaces: this.inline ? {top: this.fixedToolbarContainer} : null
            };
        }

        private listenCKEditorEvents(ckeditor: HTMLAreaEditor) {
            ckeditor.on('change', () => {
                if (this.nodeChangeHandler) {
                    this.nodeChangeHandler(null);
                }
            });

            ckeditor.on('focus', (e) => {
                if (this.focusHandler) {
                    this.focusHandler(<any>e);
                }
            });

            ckeditor.on('maximize', (e) => {
                if (e.data === 2) { // fullscreen off
                    api.ui.responsive.ResponsiveManager.fireResizeEvent();
                }
            });

            ckeditor.on('blur', (e) => {
                if (this.hasActiveDialog) {
                    //e.stopImmediatePropagation();
                    this.hasActiveDialog = false;
                }
                if (this.blurHandler) {
                    this.blurHandler(<any>e);
                }
            });

            ckeditor.on('key', (e: eventInfo) => {
                if (e.data.keyCode === 9) { // tab pressed
                    ckeditor.execCommand('indent');
                    e.cancel();
                    return;
                }

                if (e.data.keyCode === 2228233) { // shift + tab pressed
                    ckeditor.execCommand('outdent');
                    e.cancel();
                    return;
                }

                if (this.keydownHandler) {
                    this.keydownHandler(e);
                }
            });

            ckeditor.on('fileUploadRequest', (evt: eventInfo) => {
                const fileLoader = evt.data.fileLoader;
                const formData = new FormData();
                const xhr = fileLoader.xhr;

                xhr.open('POST', fileLoader.uploadUrl, true);
                formData.append('file', fileLoader.file, fileLoader.fileName);
                formData.set('parent', this.content.getPath().toString());
                formData.set('name', fileLoader.fileName);
                fileLoader.xhr.send(formData);

                // Prevented the default behavior.
                evt.stop();
            });

            // parse image upload response so cke understands it
            ckeditor.on('fileUploadResponse', (evt: eventInfo) => {
                // Prevent the default response handler.
                evt.stop();

                // Get XHR and response.
                const data = evt.data;
                const xhr = data.fileLoader.xhr;
                const response = xhr.responseText.split('|');

                if (response[1]) {
                    // An error occurred during upload.
                    data.message = response[1];
                    evt.cancel();
                } else {
                    const mediaContent = JSON.parse(response[0]);
                    const url: string = new api.content.util.ContentImageUrlResolver().setContentId(
                        mediaContent.id).setScaleWidth(true).setSize(api.util.htmlarea.dialog.ImageModalDialogCKE.maxImageWidth).resolve();
                    data.url = url;
                }
            });
        }

        private setupDialogsToOpen(ckeditor: HTMLAreaEditor) {
            ckeditor.addCommand('openMacroDialog', {
                exec: (editor) => {
                    this.notifyMacroDialog(editor);
                    return true;
                }
            });

            ckeditor.setKeystroke(CKEDITOR.CTRL + 70, 'find'); // open find dialog on CTRL + F

            CKEDITOR.plugins.addExternal('macro', this.assetsUri + '/admin/common/js/util/htmlarea/plugins/', 'macroCKE.js');

            ckeditor.on('dialogShow', (dialogShowEvent: eventInfo) => {
                switch (dialogShowEvent.data.getName()) {
                case 'anchor':
                    this.notifyAnchorDialog(dialogShowEvent);
                    break;
                case 'sourcedialog':
                    this.notifyCodeDialog(dialogShowEvent);
                    break;
                case 'specialchar':
                    dialogShowEvent.data.hide();
                    this.notifySpecialCharDialog(dialogShowEvent.editor);
                    break;
                case 'find':
                    this.notifySearchReplaceDialog(dialogShowEvent);
                    break;
                case 'link':
                    this.notifyLinkDialog(dialogShowEvent);
                    break;
                case 'image2':
                    this.notifyImageDialog(dialogShowEvent);
                    break;
                }
            });
        }

        private notifyLinkDialog(config: any) {
            let event = CreateHtmlAreaDialogEvent.create().setConfig(config).setType(
                HtmlAreaDialogType.LINK_CKE).setContent(this.content).build();
            this.publishCreateDialogEvent(event);
        }

        private notifyImageDialog(config: any) {
            let event = CreateHtmlAreaDialogEvent.create().setConfig(config).setType(
                HtmlAreaDialogType.IMAGE_CKE).setContent(this.content).build();
            this.publishCreateDialogEvent(event);
        }

        private notifyAnchorDialog(config: any) {
            let event = CreateHtmlAreaDialogEvent.create().setConfig(config).setType(
                HtmlAreaDialogType.ANCHOR_CKE).build();
            this.publishCreateDialogEvent(event);
        }

        private notifyMacroDialog(config: any) {
            let event = CreateHtmlAreaDialogEvent.create().setConfig(config).setType(
                HtmlAreaDialogType.MACRO_CKE).setContentPath(this.contentPath).setApplicationKeys(
                this.applicationKeys).setContent(
                this.content).setApplicationKeys(this.applicationKeys).build();
            this.publishCreateDialogEvent(event);
        }

        private notifySearchReplaceDialog(config: any) {
            let event = CreateHtmlAreaDialogEvent.create().setConfig(config).setType(
                HtmlAreaDialogType.SEARCHREPLACE_CKE).build();
            this.publishCreateDialogEvent(event);
        }

        private notifyCodeDialog(config: any) {
            let event = CreateHtmlAreaDialogEvent.create().setConfig(config).setType(
                HtmlAreaDialogType.CODE_CKE).build();
            this.publishCreateDialogEvent(event);
        }

        private notifySpecialCharDialog(config: any) {
            let event = CreateHtmlAreaDialogEvent.create().setConfig(config).setType(
                HtmlAreaDialogType.SPECIALCHAR_CKE).build();
            this.publishCreateDialogEvent(event);
        }

        private publishCreateDialogEvent(event: CreateHtmlAreaDialogEvent) {
            this.hasActiveDialog = true;
            this.notifyCreateDialog(event);
            event.fire();
        }

        private isToolExcluded(tool: string): boolean {
            if (!this.customToolConfig || !this.customToolConfig['exclude']) {
                return false;
            }
            return this.customToolConfig['exclude'].indexOf(tool) > -1;
        }
    }
}
