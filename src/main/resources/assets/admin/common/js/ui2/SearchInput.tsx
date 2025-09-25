import * as UI from '@enonic/ui';
import {LegacyElement} from './LegacyElement';

export class SearchInput extends LegacyElement<typeof UI.SearchInput> {

    private currentValue: string;

    constructor(props: UI.SearchInputProps) {
        const {onChange, ...rest} = props;

        super({
            onChange: (value: string) => {
                this.currentValue = value;
                props.onChange?.(value);
            },
            ...rest,
        }, UI.SearchInput);

        this.currentValue = props.value ?? '';
    }

    getValue(): string {
        return this.currentValue;
    }

    setValue(value: string): void {
        this.currentValue = value;

        this.props.setKey('value', value);
    }

    clear(): void {
        this.setValue('');
    }

}
