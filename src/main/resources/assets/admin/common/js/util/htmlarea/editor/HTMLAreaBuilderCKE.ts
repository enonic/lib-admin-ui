module api.util.htmlarea.editor {

    import HTMLAreaEditor = CKEDITOR.editor;
    import eventInfo = CKEDITOR.eventInfo;
    import NotificationMessage = api.notify.NotificationMessage;
    import NotifyManager = api.notify.NotifyManager;

    /**
     * NB: Modifications were made in ckeditor.js (VERY SORRY FOR THAT):
     * LINE 126: getFrameDocument() function updated to fix issue #542 in MS EDGE
     *
     * Update those in case ckeditor lib is updated
     */
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
            ['Format', 'Bold', 'Italic', 'Underline', 'Strike', 'Subscript', 'Superscript', 'Blockquote'],
            ['JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock'],
            ['BulletedList', 'NumberedList', 'Outdent', 'Indent'],
            ['SpecialChar', 'Anchor', 'Image', 'Macro', 'Link', 'Unlink'],
            ['Table', 'Maximize']
        ];

        private plugins: string = 'autogrow,sourcedialog,macro,image2,quicktable';

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
            this.handleFileUpload(ckeditor);
            this.handleNativeNotifications(ckeditor);
            this.setupDialogsToOpen(ckeditor);
            this.setupKeyboardShortcuts(ckeditor);
            this.addCustomLangEntries(ckeditor);
            this.removeUnwantedMenuItems(ckeditor);

            return ckeditor;
        }

        private adjustToolsList() {
            if (this.editableSourceCode) {
                this.includeTool('Sourcedialog');
            }

            this.tools.push(this.toolsToInclude);
        }

        private createConfig(): CKEDITOR.config {
            const config: CKEDITOR.config = {
                toolbar: this.tools,
                removePlugins: 'resize',
                removeButtons: this.toolsToExlcude,
                extraPlugins: this.plugins + (this.inline ? ',sharedspace' : ''),
                extraAllowedContent: 'code address',
                format_tags: 'p;h1;h2;h3;h4;h5;h6;pre;div',
                image2_disableResizer: true,
                disallowedContent: 'img[width,height]',
                uploadUrl: api.util.UriHelper.getRestUri('content/createMedia'),
                contentsCss: this.assetsUri + '/admin/common/styles/html-editor.css', // for classic mode only
                sharedSpaces: this.inline ? {top: this.fixedToolbarContainer} : null
            };

            if (!this.isToolExcluded('Code')) {
                config.format_tags = config.format_tags + ';code';
                config['format_code'] = {element: 'code'};
            }

            config['qtRows']= 10; // Count of rows
            config['qtColumns']= 10; // Count of columns
            config['qtWidth']= '100%'; // table width

            return config;
        }

        private listenCKEditorEvents(ckeditor: HTMLAreaEditor) {
            if (this.nodeChangeHandler) {
                ckeditor.on('change', this.nodeChangeHandler.bind(this));
            }

            if (this.focusHandler) {
                ckeditor.on('focus', this.focusHandler.bind(this));
            }

            if (this.keydownHandler) {
                ckeditor.on('key', this.keydownHandler.bind(this));
            }

            ckeditor.on('maximize', (e: eventInfo) => {
                if (e.data === 2) { // fullscreen off
                    api.ui.responsive.ResponsiveManager.fireResizeEvent();
                }
            });

            ckeditor.on('blur', (e: eventInfo) => {
                e.editor.getSelection().reset(); // that makes cke cleanup

                if (this.hasActiveDialog) {
                    e.stop();
                    this.hasActiveDialog = false;
                }
                if (this.blurHandler) {
                    this.blurHandler(<any>e);
                }
            });
        }

        private handleFileUpload(ckeditor: HTMLAreaEditor) {
            ckeditor.on('fileUploadRequest', (evt: eventInfo) => {
                const fileLoader = evt.data.fileLoader;

                this.isFileExisting(fileLoader.fileName).then((exists: boolean) => {
                    if (exists) {
                        NotifyManager.get().showWarning(`File ${fileLoader.fileName} already exists!`);
                        (<any>evt.editor.document.findOne('.cke_widget_uploadimage')).remove(); // removing upload preview image
                    } else {
                        this.uploadFile(fileLoader);
                    }
                }).catch((reason: any) => {
                    api.DefaultErrorHandler.handle(reason);
                }).done();

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

        private isFileExisting(fileName: string): wemQ.Promise<boolean> {
            return new api.content.resource.GetContentByPathRequest(
                new api.content.ContentPath([this.content.getPath().toString(), fileName])).sendAndParse().then(() => {
                return true;
            }).catch((reason: any) => {
                if (reason.statusCode === 404) { // good, no file with such name
                    return false;
                }

                throw new Error(reason);
            });
        }

        private uploadFile(fileLoader: any) {
            const formData = new FormData();
            const xhr = fileLoader.xhr;
            xhr.open('POST', fileLoader.uploadUrl, true);
            formData.append('file', fileLoader.file, fileLoader.fileName);
            formData.set('parent', this.content.getPath().toString());
            formData.set('name', fileLoader.fileName);
            fileLoader.xhr.send(formData);
        }

        private handleNativeNotifications(ckeditor: HTMLAreaEditor) {
            const progressNotifications: Object = {};

            ckeditor.on('notificationShow', function (evt: eventInfo) {
                const notification: any = evt.data.notification;

                switch (notification.type) {
                case 'success':
                    NotifyManager.get().showSuccess(notification.message);
                    break;
                case 'info':
                case 'progress':
                    NotifyManager.get().showFeedback(notification.message);
                    break;
                case 'warning':
                    NotifyManager.get().showError(notification.message);
                    break;
                }
                // Do not show the default notification.
                evt.cancel();
            });

            ckeditor.on('notificationUpdate', function (evt: eventInfo) {
                const message: string = evt.data.options ? evt.data.options.message : evt.data.notification.message;
                const messageId: string = evt.data.notification.id;
                const type: string = (evt.data.options && evt.data.options.type) ? evt.data.options.type : evt.data.notification.type;

                switch (type) {
                case 'success':
                    NotifyManager.get().showSuccess(message);
                    NotifyManager.get().hide(progressNotifications[messageId]);
                    delete progressNotifications[messageId];
                    break;
                case 'progress':
                    if (progressNotifications[messageId]) {
                        const notificationMessage: NotificationMessage = NotifyManager.get().getNotification(
                            progressNotifications[messageId]);
                        if (notificationMessage) {
                            notificationMessage.setText(message);
                        }
                    } else {
                        progressNotifications[messageId] = api.notify.NotifyManager.get().showFeedback(message, false);
                    }
                    break;
                }

                // Do not show the default notification.
                evt.cancel();
            });
        }

        private setupDialogsToOpen(ckeditor: HTMLAreaEditor) {
            ckeditor.addCommand('openMacroDialog', {
                exec: (editor) => {
                    this.notifyMacroDialog(editor);
                    return true;
                }
            });

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

        private setupKeyboardShortcuts(ckeditor: HTMLAreaEditor) {
            const commandDef: CKEDITOR.commandDefinition = {
                exec: function (editor: HTMLAreaEditor) {
                    editor.applyStyle(new CKEDITOR.style(<any>{element: this.name})); // name is command name
                    return true;
                }
            };

            ckeditor.addCommand('h1', commandDef);
            ckeditor.addCommand('h2', commandDef);
            ckeditor.addCommand('h3', commandDef);
            ckeditor.addCommand('h4', commandDef);
            ckeditor.addCommand('h5', commandDef);
            ckeditor.addCommand('h6', commandDef);
            ckeditor.addCommand('p', commandDef);
            ckeditor.addCommand('div', commandDef);
            ckeditor.addCommand('address', commandDef);

            ckeditor.on('instanceReady', () => {
                ckeditor.setKeystroke(9, 'indent'); // Indent on TAB
                ckeditor.setKeystroke(CKEDITOR.SHIFT + 9, 'outdent'); // Outdent on SHIFT + TAB
                ckeditor.setKeystroke(CKEDITOR.CTRL + 70, 'find'); // open find dialog on CTRL + F
                ckeditor.setKeystroke(CKEDITOR.CTRL + 75, 'link'); // open link dialog on CTRL + K
                ckeditor.setKeystroke(CKEDITOR.CTRL + 76, 'image'); // open link dialog on CTRL + L
                ckeditor.setKeystroke(CKEDITOR.CTRL + CKEDITOR.ALT + 49, 'h1'); // apply Heading 1 format
                ckeditor.setKeystroke(CKEDITOR.CTRL + CKEDITOR.ALT + 50, 'h2'); // apply Heading 2 format
                ckeditor.setKeystroke(CKEDITOR.CTRL + CKEDITOR.ALT + 51, 'h3'); // apply Heading 3 format
                ckeditor.setKeystroke(CKEDITOR.CTRL + CKEDITOR.ALT + 52, 'h4'); // apply Heading 4 format
                ckeditor.setKeystroke(CKEDITOR.CTRL + CKEDITOR.ALT + 53, 'h5'); // apply Heading 5 format
                ckeditor.setKeystroke(CKEDITOR.CTRL + CKEDITOR.ALT + 54, 'h6'); // apply Heading 6 format
                ckeditor.setKeystroke(CKEDITOR.CTRL + CKEDITOR.SHIFT + 55, 'p'); // apply the 'Normal' format
                ckeditor.setKeystroke(CKEDITOR.CTRL + CKEDITOR.SHIFT + 56, 'div'); // apply the 'Normal (DIV)' format
                ckeditor.setKeystroke(CKEDITOR.CTRL + CKEDITOR.SHIFT + 57, 'address'); // apply the 'Address' format
            });
        }

        private addCustomLangEntries(ckeditor: HTMLAreaEditor) {
            ckeditor.on('langLoaded', (evt: eventInfo) => {
                if (evt.editor.lang.format) {
                    evt.editor.lang.format.tag_code = 'Сode';
                }
            });
        }

        private removeUnwantedMenuItems(ckeditor: HTMLAreaEditor) {
            ckeditor.on('instanceReady', () => {
                ckeditor.removeMenuItem('table');
                ckeditor.removeMenuItem('tablecell_properties');
                ckeditor.removeMenuItem('paste');
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
