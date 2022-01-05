import {FormContext} from './FormContext';
import {FormItemLayer} from './FormItemLayer';
import {Store} from '../store/Store';

export interface CreatedFormItemLayerConfig {
    context: FormContext;
    lazyRender?: boolean;
    validateOccurrenceOnAdd?: boolean;
}

export interface FormItemLayerFactory {
    createLayer(config: CreatedFormItemLayerConfig): FormItemLayer;
}

export const FORM_ITEM_LAYER_FACTORY_KEY: string = 'FormItemLayerFactory';

export class FormItemLayerFactoryImpl implements FormItemLayerFactory {

    protected constructor() {}

    static get(): FormItemLayerFactoryImpl {
        let instance: FormItemLayerFactoryImpl = Store.parentInstance().get(FORM_ITEM_LAYER_FACTORY_KEY);

        if (instance == null) {
            instance = new FormItemLayerFactoryImpl();
            Store.parentInstance().set(FORM_ITEM_LAYER_FACTORY_KEY, instance);
        }

        return instance;
    }

    createLayer(config: CreatedFormItemLayerConfig): FormItemLayer {
        const layer = new FormItemLayer(config.context, FormItemLayerFactoryImpl.get());
        if (config.lazyRender != null) {
            layer.setLazyRender(config.lazyRender);
        }

        layer.setValidateOccurrenceOnAdd(!!config.validateOccurrenceOnAdd);

        return layer;
    }
}
