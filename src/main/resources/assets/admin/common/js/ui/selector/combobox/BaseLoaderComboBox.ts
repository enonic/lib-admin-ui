import * as Q from 'q';
import {BaseLoader} from '../../../util/loader/BaseLoader';
import {StringHelper} from '../../../util/StringHelper';
import {ComboBox, ComboBoxConfig} from './ComboBox';
import {LoadMask} from '../../mask/LoadMask';

export class BaseLoaderComboBox<OPTION_DISPLAY_VALUE, LOADER_DATA_TYPE>
    extends ComboBox<OPTION_DISPLAY_VALUE> {

    public static debug: boolean = false;
    private loader: BaseLoader<LOADER_DATA_TYPE>;
    private tempValue: string;
    private mask: LoadMask;

    constructor(name: string, config: ComboBoxConfig<OPTION_DISPLAY_VALUE>) {
        super(name, config);

        this.addClass('loader-combobox');

        this.mask = new LoadMask(this);
    }

    public setLoader(loader: BaseLoader<LOADER_DATA_TYPE>) {
        this.loader = loader;
    }

    protected doSetValue(value: string) {
        if (StringHelper.isEmpty(value)) {
            this.setIgnoreNextFocus(true);
            super.doSetValue(value);
            return;
        }

        if (!this.loader.isLoaded()) {
            if (BaseLoaderComboBox.debug) {
                console.debug(this.toString() + '.doSetValue: loader is not loaded, saving temp value = ' + value);
            }
            this.tempValue = value;
        }

        this.doWhenLoaded(() => {
            if (this.tempValue) {
                if (BaseLoaderComboBox.debug) {
                    console.debug(this.toString() + '.doSetValue: clearing temp value = ' + this.tempValue);
                }
                delete this.tempValue;
            }
            this.setIgnoreNextFocus(true);
            super.doSetValue(value);
        }, value);
    }

    protected doGetValue(): string {
        if (!this.loader.isLoaded() && this.tempValue != null) {
            if (BaseLoaderComboBox.debug) {
                console.debug('RichComboBox: loader is not loaded, returning temp value = ' + this.tempValue);
            }
            return this.tempValue;
        } else {
            return super.doGetValue();
        }
    }

    private doWhenLoaded(callback: Function, value: string) {
        if (this.loader.isLoaded() || this.loader.isPreLoaded()) {
            const optionsMissing: boolean = this.splitValues(value).some((val) => {
                return !this.getOptionByValue(val);
            });

            if (optionsMissing) { // option needs loading
                this.loader.preLoad(value).then(() => {
                    callback();
                });
            } else { // empty option
                callback();
            }
        } else {
            if (this.isVisible()) {
                this.mask.show();
            }
            if (BaseLoaderComboBox.debug) {
                console.debug(this.toString() + '.doWhenLoaded: waiting to be loaded');
            }

            const singleLoadListener = ((data) => {
                if (BaseLoaderComboBox.debug) {
                    console.debug(this.toString() + '.doWhenLoaded: on loaded');
                }
                callback(data);
                this.loader.unLoadedData(singleLoadListener);

                if (!this.loader.isNotStarted()) {
                    this.mask.hide();
                }

                return Q(null);
            });

            this.loader.onLoadedData(singleLoadListener);

            if (this.loader.isNotStarted()) {
                this.loader.preLoad(value).then(() => { this.mask.hide(); });
            }
        }
    }
}
