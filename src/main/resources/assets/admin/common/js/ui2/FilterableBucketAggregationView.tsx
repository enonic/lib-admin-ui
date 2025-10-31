import {Checkbox, Combobox, Listbox} from '@enonic/ui';
import {useState} from 'react';
import {BucketAggregation} from '../aggregation/BucketAggregation';
import {LegacyElement} from './LegacyElement';

export interface Props {
    idsToKeepOnToTop?: string[];
    bucketAggregation: BucketAggregation;
}

const FilterableBucketAggregationViewComponent = ({idsToKeepOnToTop, bucketAggregation}: Props): React.ReactElement => {
    const [selection, setSelection] = useState<readonly string[]>(['react', 'vue']);
    const [value, setValue] = useState('');
    const isSelected = (value: string): boolean => selection.includes(value);

    return (
        <div className='relative space-y-1'>
            <div className=''>{bucketAggregation.getName()}</div>
            <Combobox.Root value={value} onChange={setValue} selection={selection} onSelectionChange={setSelection} selectionMode={'multiple'}>
                <Combobox.Content>
                    <Combobox.Control>
                        <Combobox.Input/>
                        <Combobox.Toggle/>
                    </Combobox.Control>

                    <Combobox.Popup>
                        <Listbox.Content>
                            {bucketAggregation.getBuckets().map(bucket => (
                                <Listbox.Item key={bucket.getKey()} value={bucket.getKey()}>
                                    <div className='flex-1'>{bucket.getDisplayName()}</div>
                                    <Checkbox
                                        checked={isSelected(bucket.getKey())}
                                        tabIndex={-1}
                                    />
                                </Listbox.Item>
                            ))}
                        </Listbox.Content>
                    </Combobox.Popup>
                </Combobox.Content>
            </Combobox.Root>
        </div>
    );
}

export class FilterableBucketAggregationView
    extends LegacyElement<typeof FilterableBucketAggregationViewComponent, Props> {

    constructor(bucketAggregation: BucketAggregation) {
        super({bucketAggregation}, FilterableBucketAggregationViewComponent);
    }

    setIdsToKeepOnToTop(ids: string[]): void {

    }
}
