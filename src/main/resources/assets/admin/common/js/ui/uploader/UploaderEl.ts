import qq from 'fine-uploader/lib/core';
import {UploadItem} from './UploadItem';
import {Button} from '../button/Button';
import {Element} from '../../dom/Element';
import {ElementRenderedEvent} from '../../dom/ElementRenderedEvent';
import {ElementShownEvent} from '../../dom/ElementShownEvent';
import {i18n} from '../../util/Messages';
import {Equitable} from '../../Equitable';
import {FormInputEl} from '../../dom/FormInputEl';
import {AEl} from '../../dom/AEl';
import {DivEl} from '../../dom/DivEl';
import {ProgressBar} from '../ProgressBar';
import {AppHelper} from '../../util/AppHelper';
import {RequestError} from '../../rest/RequestError';
import {DefaultErrorHandler} from '../../DefaultErrorHandler';
import {NotifyManager} from '../../notify/NotifyManager';
import {UploadStartedEvent} from './UploadStartedEvent';
import {UploadProgressEvent} from './UploadProgressEvent';
import {UploadedEvent} from './UploadedEvent';
import {UploadCompleteEvent} from './UploadCompleteEvent';
import {UploadFailedEvent} from './UploadFailedEvent';
import {KeyBindings} from '../KeyBindings';
import {KeyBinding} from '../KeyBinding';
import {KeyHelper} from '../KeyHelper';

export interface FineUploaderFile {
    id: number;
    name: string;
    size: number;
    uuid: string;
    status: string;
    percent: number;
}

export interface UploaderElConfig {
    name: string;
    url?: string;
    hasUploadButton?: boolean;
    allowDrop?: boolean;
    selfIsDropzone?: boolean;       // allow drop no matter if the dropzone is visible
    resultAlwaysVisisble?: boolean; // never hide the result
    allowExtensions?: { title: string; extensions: string }[];
    allowMimeTypes?: string[];
    allowMultiSelection?: boolean;
    showCancel?: boolean;
    showResult?: boolean;
    maximumOccurrences?: number;
    deferred?: boolean;
    params?: { [key: string]: any };
    value?: string;
    disabled?: boolean;
    hideDefaultDropZone?: boolean;
}

export class UploaderEl<MODEL extends Equitable>
    extends FormInputEl {

    public static debug: boolean = false;
    private static FORBIDDEN_CHARS: RegExp = /[/*?|:]/g;
    protected config: UploaderElConfig;
    protected uploader: any;       // qq.FineUploaderBasic
    protected dragAndDropper: any; // qq.DragAndDrop
    protected value: string;
    protected dropzone: AEl;
    private uploadedItems: UploadItem<MODEL>[] = [];
    private extraDropzoneIds: string[] = [];
    private defaultDropzoneContainer: DropzoneContainer;
    private uploadButton: DivEl;
    private progress: ProgressBar;
    private cancelBtn: Button;
    private resultContainer: DivEl;
    private uploadStartedListeners: { (event: UploadStartedEvent<MODEL>): void }[] = [];
    private uploadProgressListeners: { (event: UploadProgressEvent<MODEL>): void }[] = [];
    private fileUploadedListeners: { (event: UploadedEvent<MODEL>): void }[] = [];
    private uploadCompleteListeners: { (event: UploadCompleteEvent<MODEL>): void }[] = [];
    private uploadFailedListeners: { (event: UploadFailedEvent<MODEL>): void }[] = [];
    private uploadResetListeners: { (): void }[] = [];
    private dropzoneDragEnterListeners: { (event: DragEvent): void }[] = [];
    private dropzoneDragLeaveListeners: { (event: DragEvent): void }[] = [];
    private dropzoneDropListeners: { (event: DragEvent): void }[] = [];
    private debouncedUploadStart: () => void;
    private shownInitHandler: (event: ElementShownEvent) => void;
    private renderedInitHandler: (event: ElementRenderedEvent) => void;

    constructor(config: UploaderElConfig) {
        super('div', 'uploader-el');

        // init defaults
        this.initConfig(config);

        if (this.config.value) {
            this.value = this.config.value;
        }

        this.initUploadButton();

        this.initDropzone();

        this.appendChild(this.progress = new ProgressBar());

        this.appendChild(this.resultContainer = new DivEl('result-container'));

        this.initCancelButton();

        this.handleKeyEvents();

        this.initDebouncedUploadStart();

        const initHandlerOnEvent = () => {
            this.initHandler();

            if (this.config.deferred) {
                this.unShown(initHandlerOnEvent);
            } else {
                this.unRendered(initHandlerOnEvent);
            }
        };

        if (this.config.deferred) {
            this.onShown(initHandlerOnEvent);
        } else {
            this.onRendered(initHandlerOnEvent);
        }
    }

    getName(): string {
        return this.config.name;
    }

    doGetValue(): string {
        return this.value;
    }

    doSetValue(value: string): UploaderEl<MODEL> {
        if (UploaderEl.debug) {
            console.log('Setting uploader value', value, this);
        }
        this.value = value;

        if (value) {
            if (this.config.showResult) {
                this.setResultVisible();
            } else {
                this.setDefaultDropzoneVisible();
            }
        } else {
            this.setDefaultDropzoneVisible();
            return this;
        }

        const newItemsToAppend: Element[] = [];
        const existingItems: Element[] = [];

        this.parseValues(value).forEach((val) => {
            if (val) {
                const existingItem = this.getExistingItem(val);
                if (!existingItem) {
                    newItemsToAppend.push(this.createResultItem(val));
                } else {
                    this.refreshExistingItem(existingItem, val);
                    existingItems.push(existingItem);
                }
            }
        });

        this.removeAllChildrenExceptGiven(existingItems);
        this.appendNewItems(newItemsToAppend);

        return this;
    }

    parseValues(jsonString: string): string[] {
        try {
            const o = JSON.parse(jsonString);

            // Handle non-exception-throwing cases:
            // Neither JSON.parse(false) or JSON.parse(1234) throw errors, hence the type-checking,
            // but... JSON.parse(null) returns 'null', and typeof null === 'object',
            if (o && typeof o === 'object' && o.length) {
                return o;
            }
        } catch (error) { /* empty*/ }

        // Value is not JSON so just return it
        return [jsonString];
    }

    createResultItem(_value: string): Element {
        throw new Error('Should be overridden by inheritors');
    }

    setMaximumOccurrences(value: number): UploaderEl<MODEL> {
        this.config.maximumOccurrences = value;
        return this;
    }

    stop(): UploaderEl<MODEL> {
        if (this.uploader) {
            this.uploader.cancelAll();
        }

        this.setResultVisible(true);
        this.uploadedItems.forEach((uploadItem: UploadItem<MODEL>) => uploadItem.notifyUploadStopped());

        this.uploadedItems.length = 0;

        return this;
    }

    reset(): UploaderEl<MODEL> {
        this.finishUpload();
        this.setValue(null);
        this.notifyUploadReset();
        this.setProgressVisible(false);
        return this;
    }

    setDefaultDropzoneVisible(visible: boolean = true, isDrag: boolean = false) {
        if (visible && this.config.hideDefaultDropZone && !isDrag) {
            return;
        }

        if (visible) {
            this.setProgressVisible(false);
            this.setResultVisible(false);
        }

        this.defaultDropzoneContainer.toggleClass('visible', visible);
    }

    setProgressVisible(visible: boolean = true) {
        if (visible) {
            this.progress.setValue(0);
            this.setDefaultDropzoneVisible(false);
            this.setResultVisible(false);
        }

        this.progress.setVisible(visible);
        this.cancelBtn.setVisible(visible && this.config.showCancel);
    }

    setResultVisible(visible: boolean = true) {
        if (!visible && this.config.resultAlwaysVisisble) {
            return;
        }

        if (visible) {
            this.setDefaultDropzoneVisible(false);
            this.setProgressVisible(false);
        }

        this.resultContainer.setVisible(visible);
    }

    createModel(_serverResponse: any): MODEL {
        throw new Error('Should be overridden by inheritors');
    }

    getModelValue(_item: MODEL): string {
        throw new Error('Should be overridden by inheritors');
    }

    setParams(params: { [key: string]: any }): UploaderEl<MODEL> {
        if (this.uploader) {
            this.uploader.setParams(params);
        }

        this.config.params = params;

        return this;
    }

    setEnabled(enabled: boolean): UploaderEl<MODEL> {
        this.config.disabled = !enabled;

        if (!enabled) {
            this.dropzone.getEl().setAttribute('disabled', 'true');
        } else {
            this.dropzone.getEl().removeAttribute('disabled');
        }

        if (!enabled && this.uploader) {
            if (UploaderEl.debug) {
                console.log('Disabling uploader', this);
            }
            this.destroyHandler();

        } else if (enabled && !this.uploader) {

            if (UploaderEl.debug) {
                console.log('Enabling uploader', this);
            }

            if (this.config.deferred) {

                if (this.isVisible()) {
                    this.initHandler();
                } else if (!this.shownInitHandler) {
                    if (UploaderEl.debug) {
                        console.log('Deferring enabling uploader until it\' shown', this);
                    }
                    this.shownInitHandler = () => {
                        this.initHandler();
                        this.unShown(this.shownInitHandler);
                        this.shownInitHandler = null;
                    };
                    this.onShown(this.shownInitHandler);
                }
            } else {

                if (this.isRendered()) {
                    this.initHandler();
                } else if (!this.renderedInitHandler) {
                    if (UploaderEl.debug) {
                        console.log('Deferring enabling uploader until it\' rendered', this);
                    }
                    this.renderedInitHandler = () => {
                        this.initHandler();
                        this.unRendered(this.renderedInitHandler);
                        this.renderedInitHandler = null;
                    };
                    this.onRendered(this.renderedInitHandler);
                }
            }
        }
        return this;
    }

    isEnabled(): boolean {
        return !this.config.disabled;
    }

    getParams(): { [key: string]: any } {
        return this.config.params;
    }

    getAllowedExtensions(): { title: string; extensions: string }[] {
        return this.config.allowExtensions;
    }

    getAllowedMimeTypes(): string[] {
        return this.config.allowMimeTypes;
    }

    addDropzone(id: string) {
        if (this.config.allowDrop) {
            this.extraDropzoneIds.push(id);
            if (this.dragAndDropper) {
                const elem = document.getElementById(id);
                if (elem) {
                    this.dragAndDropper.setupExtraDropzone(elem);
                }
            }
        }
    }

    getUploadButton(): DivEl {
        return this.uploadButton;
    }

    hasUploadButton(): boolean {
        return !!this.config.hasUploadButton;
    }

    getResultContainer(): DivEl {
        return this.resultContainer;
    }

    getDefaultDropzoneContainer(): DivEl {
        return this.defaultDropzoneContainer;
    }

    getDropzone(): AEl {
        return this.dropzone;
    }

    showFileSelectionDialog() {
        Element.fromHtmlElement(this.uploader.getInputButton().getInput()).getEl().simulate('click');
    }

    onUploadStarted(listener: (event: UploadStartedEvent<MODEL>) => void) {
        this.uploadStartedListeners.push(listener);
    }

    unUploadStarted(listener: (event: UploadStartedEvent<MODEL>) => void) {
        this.uploadStartedListeners = this.uploadStartedListeners.filter((currentListener) => {
            return listener !== currentListener;
        });
    }

    onUploadProgress(listener: (event: UploadProgressEvent<MODEL>) => void) {
        this.uploadProgressListeners.push(listener);
    }

    unUploadProgress(listener: (event: UploadProgressEvent<MODEL>) => void) {
        this.uploadProgressListeners = this.uploadProgressListeners.filter((currentListener) => {
            return listener !== currentListener;
        });
    }

    onFileUploaded(listener: (event: UploadedEvent<MODEL>) => void) {
        this.fileUploadedListeners.push(listener);
    }

    unFileUploaded(listener: (event: UploadedEvent<MODEL>) => void) {
        this.fileUploadedListeners = this.fileUploadedListeners.filter((currentListener) => {
            return listener !== currentListener;
        });
    }

    onUploadCompleted(listener: (event: UploadCompleteEvent<MODEL>) => void) {
        this.uploadCompleteListeners.push(listener);
    }

    unUploadCompleted(listener: (event: UploadCompleteEvent<MODEL>) => void) {
        this.uploadCompleteListeners = this.uploadCompleteListeners.filter((currentListener) => {
            return listener !== currentListener;
        });
    }

    onUploadReset(listener: () => void) {
        this.uploadResetListeners.push(listener);
    }

    unUploadReset(listener: () => void) {
        this.uploadResetListeners = this.uploadResetListeners.filter((currentListener) => {
            return listener !== currentListener;
        });
    }

    onUploadFailed(listener: (event: UploadFailedEvent<MODEL>) => void) {
        this.uploadFailedListeners.push(listener);
    }

    unUploadFailed(listener: (event: UploadFailedEvent<MODEL>) => void) {
        this.uploadFailedListeners = this.uploadFailedListeners.filter((currentListener) => {
            return listener !== currentListener;
        });
    }

    onDropzoneDragEnter(listener: (event: DragEvent) => void) {
        this.dropzoneDragEnterListeners.push(listener);
    }

    unDropzoneDragEnter(listener: (event: DragEvent) => void) {
        this.dropzoneDragEnterListeners = this.dropzoneDragEnterListeners.filter((currentListener) => {
            return listener !== currentListener;
        });
    }

    onDropzoneDragLeave(listener: (event: DragEvent) => void) {
        this.dropzoneDragLeaveListeners.push(listener);
    }

    unDropzoneDragLeave(listener: (event: DragEvent) => void) {
        this.dropzoneDragLeaveListeners = this.dropzoneDragLeaveListeners.filter((currentListener) => {
            return listener !== currentListener;
        });
    }

    onDropzoneDrop(listener: (event: DragEvent) => void) {
        this.dropzoneDropListeners.push(listener);
    }

    unDropzoneDragDrop(listener: (event: DragEvent) => void) {
        this.dropzoneDropListeners = this.dropzoneDropListeners.filter((currentListener) => {
            return listener !== currentListener;
        });
    }

    protected initHandler() {
        if (this.config.disabled) {
            if (UploaderEl.debug) {
                console.log('Skipping init, because of config.disabled = true', this);
            }
        } else {
            if (UploaderEl.debug) {
                console.log('Initing uploader', this);
            }
            if (!this.uploader && this.config.url) {
                this.uploader = this.initUploader();

                if (this.value) {
                    this.setValue(this.value);
                } else if (!this.config.hideDefaultDropZone) {
                    this.setDefaultDropzoneVisible();
                }
            }
        }
    }

    protected appendNewItems(newItemsToAppend: Element[]) {
        newItemsToAppend.forEach((elem: Element) => this.getResultContainer().appendChild(elem));
    }

    protected removeAllChildrenExceptGiven(itemsToKeep: Element[]) {
        const items: Element[] = this.getResultContainer().getChildren();
        const toRemove = [];

        items.forEach((elem: Element) => {
            if (!itemsToKeep.some((itemToKeep: Element) => itemToKeep === elem)) {
                toRemove.push(elem);
            }
        });
        toRemove.forEach((elem: Element) => elem.remove());
    }

    protected refreshExistingItem(_existingItem: Element, _value: string) {
        // must be implemented by children
    }

    protected getExistingItem(_value: string): Element {
        return null;
    }

    protected getErrorMessage(fileString: string): string {
        return 'File(s) [' + fileString + '] were not uploaded';
    }

    protected initUploader() {
        const uploader = new qq.FineUploaderBasic({
            debug: false,
            button: document.getElementById(this.dropzone.getId()),
            multiple: this.config.allowMultiSelection,
            folders: false,
            autoUpload: false,
            request: {
                endpoint: this.config.url,
                params: this.config.params || {},
                inputName: 'file',
                filenameParam: 'name'
            },
            validation: {
                acceptFiles: this.getFileExtensions(this.config.allowExtensions)
                    .concat(this.config.allowMimeTypes)
                    .join(',')
            },
            text: {
                fileInputTitle: ''
            },
            callbacks: {
                onSubmit: this.submitCallback.bind(this),
                onStatusChange: this.statusChangeCallback.bind(this),
                onProgress: this.progressCallback.bind(this),
                onComplete: this.fileCompleteCallback.bind(this),
                onError: this.errorCallback.bind(this),
                onAllComplete: this.allCompleteCallback.bind(this)
            }
        });

        if (this.config.allowDrop) {
            this.dragAndDropper = new qq.DragAndDrop({
                dropZoneElements: this.getDropzoneElements(),
                classes: {
                    dropActive: 'dz-dragover'
                },
                callbacks: {
                    //this submits the dropped files to uploader
                    processingDroppedFilesComplete: (files) => {
                        if (!this.isUploading()) {
                            uploader.addFiles(files);
                        }
                    },
                    onDrop: (event: DragEvent) => this.notifyDropzoneDrop(event),
                    onDragEnter: (event: DragEvent) => this.notifyDropzoneDragEnter(event),
                    onDragLeave: (event: DragEvent) => this.notifyDropzoneDragLeave(event)
                }
            });
        }

        this.disableInputFocus(); // on init
        return uploader;
    }

    protected isUploading(): boolean {
        return this.hasClass('uploading');
    }

    protected notifyFileUploadStarted(uploadItems: UploadItem<MODEL>[]) {
        this.uploadStartedListeners.forEach((listener: (event: UploadStartedEvent<MODEL>) => void) => {
            listener(new UploadStartedEvent<MODEL>(uploadItems));
        });
    }

    protected notifyFileUploaded(uploadItem: UploadItem<MODEL>) {
        this.fileUploadedListeners.forEach((listener: (event: UploadedEvent<MODEL>) => void) => {
            listener.call(this, new UploadedEvent<MODEL>(uploadItem));
        });
    }

    private initUploadButton() {
        if (!this.config.hasUploadButton) {
            return;
        }
        this.uploadButton = new DivEl('upload-button');
        this.uploadButton.setId('upload-button-' + new Date().getTime());
        this.uploadButton.onClicked(() => this.showFileSelectionDialog());
        this.uploadButton.onKeyPressed((event: KeyboardEvent) => {
            if (KeyHelper.isEnterKey(event)) {
                this.showFileSelectionDialog();
            }
        });
        this.uploadButton.getEl().setTabIndex(0);
        this.appendChild(this.uploadButton);
    }

    private initDebouncedUploadStart() {
        this.debouncedUploadStart = AppHelper.debounce(() => {
            this.notifyFileUploadStarted(this.uploadedItems);
            this.uploader.uploadStoredFiles();
        }, 250, false);
    }

    private initDropzone() {
        this.defaultDropzoneContainer = new DropzoneContainer();
        this.dropzone = this.defaultDropzoneContainer.getDropzone();
        this.defaultDropzoneContainer.addClass('default-dropzone-container');
        this.appendChild(this.defaultDropzoneContainer);
    }

    private initCancelButton() {
        this.cancelBtn = new Button(i18n('action.cancel'));
        this.cancelBtn.setVisible(this.config.showCancel);
        this.cancelBtn.onClicked(() => {
            this.stop();
            this.reset();
        });
        this.appendChild(this.cancelBtn);
    }

    private handleKeyEvents() {
        this.onKeyPressed((event: KeyboardEvent) => {
            if (this.defaultDropzoneContainer.isVisible() && event.keyCode === 13) {
                this.dropzone.getEl().simulate('click');
            }
        });

        const resetHandler = () => {
            this.reset();
            return false;
        };
        KeyBindings.get().bindKeys([
            new KeyBinding('del', resetHandler),
            new KeyBinding('backspace', resetHandler)
        ]);
    }

    private destroyHandler() {
        if (UploaderEl.debug) {
            console.log('Destroying uploader', this);
        }
        if (this.uploader) {
            this.uploader.reset(true);
            this.uploader = null;
        }
        if (this.dragAndDropper) {
            this.dragAndDropper.dispose();
            this.dragAndDropper = null;
        }
    }

    private initConfig(config: UploaderElConfig) {
        this.config = config;

        if (this.config.showResult == null) {
            this.config.showResult = true;
        }
        if (this.config.allowMultiSelection == null) {
            this.config.allowMultiSelection = false;
        }
        if (this.config.showCancel == null) {
            this.config.showCancel = true;
        }

        //TODO: property is not used. it might have sense to use it when filtering upload file candidates.
        // otherwise - just remove it
        if (this.config.maximumOccurrences == null) {
            this.config.maximumOccurrences = 0;
        }
        if (this.config.hasUploadButton == null) {
            this.config.hasUploadButton = true;
        }
        if (this.config.allowDrop == null) {
            this.config.allowDrop = true;
        }
        if (this.config.selfIsDropzone == null) {
            this.config.selfIsDropzone = false;
        }
        if (this.config.resultAlwaysVisisble == null) {
            this.config.resultAlwaysVisisble = false;
        }
        if (this.config.allowExtensions == null) {
            this.config.allowExtensions = [];
        }
        if (this.config.allowMimeTypes == null) {
            this.config.allowMimeTypes = [];
        }
        if (this.config.deferred == null) {
            this.config.deferred = false;
        }
        if (this.config.disabled == null) {
            this.config.disabled = false;
        }
        if (this.config.hideDefaultDropZone == null) {
            this.config.hideDefaultDropZone = true;
        }
    }

    private findUploadItemById(id: number): UploadItem<MODEL> {
        for (let i = 0; i < this.uploadedItems.length; i++) {
            const uploadItem = this.uploadedItems[i];
            if (uploadItem.getId() === String(id)) {
                return uploadItem;
            }
        }
        return null;
    }

    private submitCallback(id: number, name: string) {
        this.uploader.setName(id, this.sanitizeName(name));
        this.uploadedItems.push(this.processFile(id, name));

        this.startUpload();

        this.setProgressVisible();

        this.debouncedUploadStart();
    }

    private processFile(id: number, name: string): UploadItem<MODEL> {
        const file: FineUploaderFile = this.uploader.getFile(id);
        file.id = id;

        const uploadFile = new UploadItem<MODEL>(file);
        uploadFile.setName(this.removeFileNameExtension(name));

        return uploadFile;
    }

    private sanitizeName(name: string): string {
        return name.replace(UploaderEl.FORBIDDEN_CHARS, '_');
    }

    private removeFileNameExtension(name: string): string {
        if (name.lastIndexOf('.') > 0) {
            return name.substr(0, name.lastIndexOf('.'));
        }

        return name;
    }

    private statusChangeCallback(id: number, _oldStatus: string, newStatus: string) {
        const uploadItem = this.findUploadItemById(id);
        if (!!uploadItem) {
            uploadItem.setStatus(newStatus);
        }
    }

    private progressCallback(id: number, _name: string, uploadedBytes: number, totalBytes: number) {
        const percent = Math.round(uploadedBytes / totalBytes * 100);

        this.progress.setValue(percent);

        const uploadItem = this.findUploadItemById(id);
        if (uploadItem) {
            uploadItem.setProgress(percent);
            this.notifyFileUploadProgress(uploadItem);
        }
    }

    private fileCompleteCallback(id: number, _name: string, response: any, xhrOrXdr: XMLHttpRequest) {
        if (xhrOrXdr && xhrOrXdr.status === 200) {
            try {
                const uploadItem = this.findUploadItemById(id);
                if (uploadItem) {
                    const model: MODEL = this.createModel(JSON.parse(xhrOrXdr.response));
                    uploadItem.setModel(model);
                    this.notifyFileUploaded(uploadItem);
                }
            } catch (e) {
                console.warn('Failed to parse the response', response, e);
            }
        }
    }

    private errorCallback(id: number, name: string, _errorReason: any, xhrOrXdr: XMLHttpRequest) {
        if (xhrOrXdr && xhrOrXdr.status !== 200) {
            try {
                const responseObj = JSON.parse(xhrOrXdr.response);
                const error = new RequestError(responseObj.status, responseObj.message);
                DefaultErrorHandler.handle(error);
            } catch (e) {
                console.warn('Failed to parse the response', xhrOrXdr.response, e);
                NotifyManager.get().showError(this.getErrorMessage(name));
            }

            const uploadItem = this.findUploadItemById(id);
            if (uploadItem) {
                uploadItem.setModel(null);
                this.notifyUploadFailed(uploadItem);
            }
            this.finishUpload();
        }
    }

    private allCompleteCallback() {
        const values = [];
        this.uploadedItems.forEach((item) => {
            if (item.getStatus() === qq.status.UPLOAD_SUCCESSFUL) {
                if (item.getModel()) {
                    values.push(this.getModelValue(item.getModel()));
                } else {
                    item.notifyFailed();
                    this.notifyUploadFailed(item);
                }
            }
        });

        if (values.length > 0) {
            this.setValue(JSON.stringify(values), false, true);
            this.notifyUploadCompleted(this.uploadedItems);
        }

        this.uploadedItems.length = 0;

        this.finishUpload();
    }

    private getFileExtensions(allowExtensions: { title: string; extensions: string }[]): string[] {
        let result = [];
        allowExtensions.forEach(allowType => {
            if (allowType.extensions) {
                result = result.concat(allowType.extensions.split(',').map(extension => '.' + extension));
            }
        });
        return result;
    }

    private getDropzoneElements(): HTMLElement[] {
        const dropElements = [];
        if (this.config.selfIsDropzone) {
            dropElements.push(document.getElementById(this.getId()));
        } else {
            dropElements.push(document.getElementById(this.dropzone.getId()));
        }

        this.extraDropzoneIds.forEach(id => {
            const elem = document.getElementById(id);
            if (elem) {
                dropElements.push(elem);
            }
        });

        return dropElements;
    }

    private disableInputFocus() {
        const focusableElements: NodeListOf<HTMLInputElement> =
            this.getDefaultDropzoneContainer().getHTMLElement().getElementsByTagName('input');
        for (let i = 0; i < focusableElements.length; i++) {
            const el = <HTMLInputElement>focusableElements.item(i);
            el.tabIndex = -1;
        }
    }

    private startUpload() {
        this.toggleClass('uploading', true);
    }

    private finishUpload() {
        this.setProgressVisible(false);
        this.toggleClass('uploading', false);
    }

    private notifyDropzoneDragEnter(event: DragEvent) {
        this.dropzoneDragEnterListeners.forEach((listener: (event: DragEvent) => void) => {
            listener(event);
        });
    }

    private notifyDropzoneDragLeave(event: DragEvent) {
        this.dropzoneDragLeaveListeners.forEach((listener: (event: DragEvent) => void) => {
            listener(event);
        });
    }

    private notifyDropzoneDrop(event: DragEvent) {
        this.dropzoneDropListeners.forEach((listener: (event: DragEvent) => void) => {
            listener(event);
        });
    }

    private notifyFileUploadProgress(uploadItem: UploadItem<MODEL>) {
        this.uploadProgressListeners.forEach((listener: (event: UploadProgressEvent<MODEL>) => void) => {
            listener(new UploadProgressEvent<MODEL>(uploadItem));
        });
    }

    private notifyUploadCompleted(uploadItems: UploadItem<MODEL>[]) {
        this.uploadCompleteListeners.forEach((listener: (event: UploadCompleteEvent<MODEL>) => void) => {
            listener(new UploadCompleteEvent<MODEL>(uploadItems));
        });
    }

    private notifyUploadReset() {
        this.uploadResetListeners.forEach((listener: () => void) => {
            listener.call(this);
        });
    }

    private notifyUploadFailed(uploadItem: UploadItem<MODEL>) {
        this.uploadFailedListeners.forEach((listener: (event: UploadFailedEvent<MODEL>) => void) => {
            listener(new UploadFailedEvent<MODEL>(uploadItem));
        });
    }
}

export class DropzoneContainer
    extends DivEl {

    private dropzone: AEl;

    constructor(hasMask: boolean = false) {
        super('dropzone-container');
        this.initDropzone();
        if (hasMask) {
            this.appendChild(new DivEl('uploader-mask'));
        }
    }

    getDropzone(): AEl {
        return this.dropzone;
    }

    private initDropzone() {
        this.dropzone = new AEl('dropzone');
        this.dropzone.setId('uploader-dropzone-' + new Date().getTime());
        this.dropzone.getEl().setTabIndex(-1);// for mac default settings
        this.dropzone.getEl().setAttribute('data-drop', i18n('drop.file.normal'));
        this.dropzone.getEl().setAttribute('data-drop-default', i18n('drop.clickable'));
        this.getEl().setTabIndex(0);
        this.appendChild(this.dropzone);
    }
}
