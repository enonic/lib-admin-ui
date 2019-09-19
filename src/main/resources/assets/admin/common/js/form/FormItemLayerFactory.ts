import {FormContext} from './FormContext';
import {FormItemLayer} from './FormItemLayer';

export interface CreatedFormItemLayerConfig {
    context: FormContext;
    lazyRender?: boolean;
}

export interface FormItemLayerFactory {
    createLayer(config: CreatedFormItemLayerConfig): FormItemLayer;
}

export class FormItemLayerFactoryImpl implements FormItemLayerFactory {

    private static INSTANCE: FormItemLayerFactoryImpl;

    protected constructor() {}

    static get(): FormItemLayerFactoryImpl {
        if (FormItemLayerFactoryImpl.INSTANCE == null) {
            FormItemLayerFactoryImpl.INSTANCE = new FormItemLayerFactoryImpl();
        }
        return FormItemLayerFactoryImpl.INSTANCE;
    }

    createLayer(config: CreatedFormItemLayerConfig): FormItemLayer {
        const layer = new FormItemLayer(config.context, FormItemLayerFactoryImpl.INSTANCE);
        if (config.lazyRender != null) {
            layer.setLazyRender(config.lazyRender);
        }
        return layer;
    }
}
