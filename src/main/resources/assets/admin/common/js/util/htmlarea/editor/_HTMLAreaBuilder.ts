module api.util.htmlarea.editor {

    import CreateHtmlAreaDialogEvent = api.util.htmlarea.dialog.CreateHtmlAreaDialogEvent;
    import ApplicationKey = api.application.ApplicationKey;
    import HTMLAreaEditor = CKEDITOR.editor;
    import config = CKEDITOR.config;

    export class _HTMLAreaBuilder {

        private content: api.content.ContentSummary; // used for image dialog
        private contentPath: api.content.ContentPath; // used for macro dialog
        private applicationKeys: ApplicationKey[]; // used for macro dialog

        private assetsUri: string;
        private editorContainerId: string;
        private focusHandler: (e: FocusEvent) => void;
        private blurHandler: (e: FocusEvent) => void;
        private keydownHandler: (e: KeyboardEvent) => void;
        private keyupHandler: (e: KeyboardEvent) => void;
        private nodeChangeHandler: (e: any) => void;
        private createDialogListeners: { (event: CreateHtmlAreaDialogEvent): void }[] = [];
        private inline: boolean = false;
        private fixedToolbarContainer: string;
        private convertUrls: boolean = false;
        private hasActiveDialog: boolean = false;
        private customToolConfig: any;
        private editableSourceCode: boolean;
        private forcedRootBlock: string;
        private toolsToExlcude: string = '';
        private toolsToInclude: string[] = [];

        private tools: any[] = [
            {name: 'gr1', items: ['Format', 'Bold', 'Italic', 'Underline', 'Strike', 'Subscript', 'Superscript', 'Blockquote']},
            {name: 'gr2', items: ['JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock']},
            {name: 'gr3', items: ['BulletedList', 'NumberedList', 'Outdent', 'Indent']},
            {name: 'gr4', items: ['SpecialChar', 'Anchor', 'Image', 'Link', 'Unlink']},
            {name: 'gr5', items: ['Table', '-', 'PasteText', '-', 'Sourcedialog', 'Maximize']}
        ];

        private plugins: string = 'autogrow,codeTag,code,sourcedialog';

        setEditableSourceCode(value: boolean): _HTMLAreaBuilder {
            this.editableSourceCode = value;
            return this;
        }

        setAssetsUri(assetsUri: string): _HTMLAreaBuilder {
            this.assetsUri = assetsUri;
            return this;
        }

        setEditorContainerId(id: string): _HTMLAreaBuilder {
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

        setFocusHandler(focusHandler: (e: FocusEvent) => void): _HTMLAreaBuilder {
            this.focusHandler = focusHandler;
            return this;
        }

        setBlurHandler(blurHandler: (e: FocusEvent) => void): _HTMLAreaBuilder {
            this.blurHandler = blurHandler;
            return this;
        }

        setKeydownHandler(keydownHandler: (e: KeyboardEvent) => void): _HTMLAreaBuilder {
            this.keydownHandler = keydownHandler;
            return this;
        }

        setKeyupHandler(keyupHandler: (e: KeyboardEvent) => void): _HTMLAreaBuilder {
            this.keyupHandler = keyupHandler;
            return this;
        }

        setNodeChangeHandler(nodeChangeHandler: (e: any) => void): _HTMLAreaBuilder {
            this.nodeChangeHandler = api.util.AppHelper.debounce((e) => {
                nodeChangeHandler(e);
            }, 200);

            return this;
        }

        setInline(inline: boolean): _HTMLAreaBuilder {
            this.inline = inline;
            return this;
        }

        setFixedToolbarContainer(fixedToolbarContainer: string): _HTMLAreaBuilder {
            this.fixedToolbarContainer = fixedToolbarContainer;
            return this;
        }

        setContent(content: api.content.ContentSummary): _HTMLAreaBuilder {
            this.content = content;
            return this;
        }

        setContentPath(contentPath: api.content.ContentPath): _HTMLAreaBuilder {
            this.contentPath = contentPath;
            return this;
        }

        setConvertUrls(convertUrls: boolean): _HTMLAreaBuilder {
            this.convertUrls = convertUrls;
            return this;
        }

        setApplicationKeys(applicationKeys: ApplicationKey[]): _HTMLAreaBuilder {
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

        setTools(tools: any): _HTMLAreaBuilder {
            this.customToolConfig = tools;

            if (tools['exclude'] && tools['exclude'] instanceof Array) {
                this.toolsToExlcude = tools['exclude'].join();
            }
            if (tools['include'] && tools['include'] instanceof Array) {
                this.includeTools(tools['include']);
            }

            return this;
        }

        setForcedRootBlock(el: string): _HTMLAreaBuilder {
            this.forcedRootBlock = el;

            return this;
        }

        private checkRequiredFieldsAreSet() {
            if (!this.assetsUri || !this.editorContainerId || !this.content) {
                throw new Error('some required fields are missing for tinymce editor');
            }
        }

        public createEditor(): HTMLAreaEditor {
            this.checkRequiredFieldsAreSet();

            if (this.editableSourceCode && !this.isToolExcluded('Code')) {
                this.includeTool('Code');
            }

            this.tools.push({name: 'custom', items: this.toolsToInclude});

            const config: config = {
                toolbar: this.tools,
                removePlugins: 'resize',
                removeButtons: this.toolsToExlcude,
                extraPlugins: this.plugins + (this.inline ? ',sharedspace' : ''),
                autoGrow_onStartup: true,
                contentsCss: this.assetsUri + '/admin/common/styles/api/util/htmlarea/html-editor.css', // for classic mode only
                sharedSpaces: this.inline ? {top: this.fixedToolbarContainer} : null
            };

            const ckeditor: HTMLAreaEditor = this.inline ? CKEDITOR.inline(this.editorContainerId, config) : CKEDITOR.replace(
                this.editorContainerId, config);

            ckeditor.on('change', (e) => {
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

            ckeditor.addCommand('openCodeDialog', {
                exec: (editor) => {
                    this.notifyCodeDialog(editor);
                    return true;
                }
            });

            CKEDITOR.plugins.addExternal('code', this.assetsUri + '/admin/common/js/util/htmlarea/plugins/', '_code.js');

            return ckeditor;
        }


        private notifyLinkDialog(config: any) {
            let event = CreateHtmlAreaDialogEvent.create().setConfig(config).setType(
                api.util.htmlarea.dialog.HtmlAreaDialogType.LINK).setContent(this.content).build();
            this.publishCreateDialogEvent(event);
        }

        private notifyImageDialog(config: any) {
            let event = CreateHtmlAreaDialogEvent.create().setConfig(config).setType(
                api.util.htmlarea.dialog.HtmlAreaDialogType.IMAGE).setContent(this.content).build();
            this.publishCreateDialogEvent(event);
        }

        private notifyAnchorDialog(config: any) {
            let event = CreateHtmlAreaDialogEvent.create().setConfig(config).setType(
                api.util.htmlarea.dialog.HtmlAreaDialogType.ANCHOR).build();
            this.publishCreateDialogEvent(event);
        }

        private notifyMacroDialog(config: any) {
            let event = CreateHtmlAreaDialogEvent.create().setConfig(config).setType(
                api.util.htmlarea.dialog.HtmlAreaDialogType.MACRO).setContentPath(this.contentPath).setApplicationKeys(
                this.applicationKeys).setType(api.util.htmlarea.dialog.HtmlAreaDialogType.MACRO).setContent(
                this.content).setApplicationKeys(this.applicationKeys).build();
            this.publishCreateDialogEvent(event);
        }

        private notifySearchReplaceDialog(config: any) {
            let event = CreateHtmlAreaDialogEvent.create().setConfig(config).setType(
                api.util.htmlarea.dialog.HtmlAreaDialogType.SEARCHREPLACE).build();
            this.publishCreateDialogEvent(event);
        }

        private notifyCodeDialog(editor: HTMLAreaEditor) {
            let event = CreateHtmlAreaDialogEvent.create().setConfig(editor).setType(
                api.util.htmlarea.dialog.HtmlAreaDialogType.CODE).build();
            this.publishCreateDialogEvent(event);
        }

        private notifyCharMapDialog(config: any) {
            let event = CreateHtmlAreaDialogEvent.create().setConfig(config).setType(
                api.util.htmlarea.dialog.HtmlAreaDialogType.CHARMAP).build();
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
