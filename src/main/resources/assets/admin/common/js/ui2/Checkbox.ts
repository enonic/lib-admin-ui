import * as UI from '@enonic/ui';

import {LegacyElement} from './LegacyElement';

export interface CheckboxProps {
    className?: string;
    label: string;
    checked?: boolean;
    onChange?: (checked: boolean) => void;
}

export class Checkbox
    extends LegacyElement<typeof UI.Checkbox> {

    constructor(props: CheckboxProps) {
        super(props, UI.Checkbox);
    }
}
