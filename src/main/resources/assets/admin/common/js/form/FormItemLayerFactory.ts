import {FormContext} from './FormContext';
import {FormItemLayer} from './FormItemLayer';
import {FormItemState} from './FormItemState';

export interface CreatedFormItemLayerConfig {
    context: FormContext;
    lazyRender?: boolean;
    formItemState?: FormItemState;
}

export interface FormItemLayerFactory {
    createLayer(config: CreatedFormItemLayerConfig): FormItemLayer;
}

// Not cached in the window-global Store: bundles sharing it would reuse a foreign
// factory whose objects fail this bundle's instanceof checks (lib-admin-ui#4588).
let instance: FormItemLayerFactoryImpl;

export class FormItemLayerFactoryImpl implements FormItemLayerFactory {

    protected constructor() {}

    static get(): FormItemLayerFactoryImpl {
        if (instance == null) {
            instance = new FormItemLayerFactoryImpl();
        }

        return instance;
    }

    createLayer(config: CreatedFormItemLayerConfig): FormItemLayer {
        const layer: FormItemLayer = new FormItemLayer(config.context, FormItemLayerFactoryImpl.get());

        if (config.lazyRender != null) {
            layer.setLazyRender(config.lazyRender);
        }

        const state: FormItemState = config.formItemState || FormItemState.EXISTING;
        layer.setFormItemState(state);

        return layer;
    }
}
