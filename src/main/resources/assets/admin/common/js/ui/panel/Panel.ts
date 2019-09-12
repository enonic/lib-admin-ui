import * as Q from 'q';
import {DivEl} from '../../dom/DivEl';
import {Action} from '../Action';
import {ObjectHelper} from '../../ObjectHelper';
import {WizardPanel} from '../../app/wizard/WizardPanel';
import {BrowsePanel} from '../../app/browse/BrowsePanel';
import {ItemViewPanel} from '../../app/view/ItemViewPanel';
import {ActionContainer} from '../ActionContainer';
import {PanelStripHeader} from './PanelStripHeader';

/**
 * Use Panel when you need a container that needs 100% height.
 */
export class Panel
    extends DivEl {

    protected outerHeader: PanelStripHeader;
    private doOffset: boolean;

    constructor(className?: string) {
        super('panel' + (className ? ' ' + className : ''));
        this.doOffset = true;

        this.onAdded(() => {
            if (this.doOffset) {
                this.calculateOffset();
            }
        });
    }

    setDoOffset(value: boolean) {
        this.doOffset = value;

        if (value && this.isRendered()) {
            this.calculateOffset();
        }
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            if (this.doOffset) {
                this.calculateOffset();
            }

            return rendered;
        });
    }

    setOuterHeader(header: PanelStripHeader) {
        this.outerHeader = header;
    }

    showOuterHeader() {
        if (this.outerHeader) {
            this.outerHeader.show();
        }
    }

    hideOuterHeader() {
        if (this.outerHeader) {
            this.outerHeader.hide();
        }
    }

    isExpandable(): boolean {
        return false;
    }

    setExpandState(_value: boolean) {
        return;
    }

    protected calculateOffset() {
        // calculates bottom of previous element in dom and set panel top to this value.
        let previous = this.getEl().getPrevious();
        let top = previous ? (previous.getOffsetTopRelativeToParent() + previous.getHeightWithMargin()) : 0;

        this.getEl().setTopPx(top);
    }

    protected resolveActions(panel: Panel): Action[] {
        let actions = [];
        if (ObjectHelper.iFrameSafeInstanceOf(panel, WizardPanel) ||
            ObjectHelper.iFrameSafeInstanceOf(panel, BrowsePanel) ||
            ObjectHelper.iFrameSafeInstanceOf(panel, ItemViewPanel)) {
            let actionContainer: ActionContainer = <any>panel;
            actions = actions.concat(actionContainer.getActions());
        }
        return actions;
    }
}
