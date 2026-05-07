import {SearchField, type SearchFieldRootProps} from '@enonic/ui';
import type {ReactElement} from 'react';
import {i18n} from '../util/Messages';
import {LegacyElement} from './LegacyElement';

const SEARCH_INPUT_NAME = 'SearchInput';

const SearchInput = ({placeholder, ...props}: SearchFieldRootProps): ReactElement => {
    return (
        <SearchField.Root placeholder={placeholder ?? i18n('panel.filter.search')} {...props}>
            <SearchField.Icon />
            <SearchField.Input />
            <SearchField.Clear />
        </SearchField.Root>
    );
};

SearchInput.displayName = SEARCH_INPUT_NAME;

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
