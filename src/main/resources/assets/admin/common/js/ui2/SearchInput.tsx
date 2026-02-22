import {SearchField, type SearchFieldRootProps} from '@enonic/ui';
import {LegacyElement} from './LegacyElement';

const SearchInput = (props: SearchFieldRootProps) => {
    return (
        <SearchField.Root {...props}>
            <SearchField.Icon />
            <SearchField.Input />
            <SearchField.Clear />
        </SearchField.Root>
    );
};

export class SearchInputComponent extends LegacyElement<typeof SearchInput> {
    private currentValue: string;

    constructor(props: SearchFieldRootProps) {
        const {onChange, ...rest} = props;

        super(
            {
                onChange: (value: string) => {
                    this.currentValue = value;
                    props.onChange?.(value);
                },
                ...rest,
            },
            SearchInput,
        );

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
