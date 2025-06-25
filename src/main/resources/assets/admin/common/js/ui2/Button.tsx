import * as UI from '@enonic/ui';

import {LegacyElement} from './LegacyElement';

export type ButtonProps = UI.ButtonProps;

export class Button extends LegacyElement<typeof UI.Button, ButtonProps> {
    constructor(props: ButtonProps) {
        super(props, UI.Button);
    }
}
