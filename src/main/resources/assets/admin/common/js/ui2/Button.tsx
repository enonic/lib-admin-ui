import * as UI from '@enonic/ui';

import {LegacyElement} from './LegacyElement';

export interface ButtonProps {
    className?: string;
    label: string;
    onClick?: () => void;
}

export class Button extends LegacyElement<typeof UI.Button, ButtonProps> {

    constructor(props: ButtonProps) {
        super(props, UI.Button);
    }
}
