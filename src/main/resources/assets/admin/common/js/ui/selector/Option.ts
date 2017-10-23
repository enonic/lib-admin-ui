module api.ui.selector {

    export interface Option<T> extends Slick.SlickData {

        value:string;

        displayValue:T;

        indices?: string[];

        readOnly?: boolean;

        empty? :boolean;

        selectable?: boolean;

        expandable?: boolean;

        image? :boolean;
    }
}
