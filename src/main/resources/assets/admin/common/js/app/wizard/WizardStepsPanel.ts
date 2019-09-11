import {TabBarItem} from '../../ui/tab/TabBarItem';
import {Panel} from '../../ui/panel/Panel';
import {NavigatedPanelStrip} from '../../ui/panel/NavigatedPanelStrip';
import {Element} from '../../dom/Element';
import {WizardStepNavigator} from './WizardStepNavigator';

export class WizardStepsPanel
    extends NavigatedPanelStrip {

    constructor(navigator: WizardStepNavigator, scrollable?: Element) {
        super(navigator, scrollable, 'wizard-steps-panel');
    }

    insertNavigablePanel(item: TabBarItem, panel: Panel, header: string, index: number, select?: boolean): number {
        if (panel.isExpandable()) {
            panel.onHidden(() => {
                item.hide();
            });

            panel.onShown(() => {
                item.show();
            });
        }

        super.insertNavigablePanel(item, panel, header, index, select);

        return index;
    }
}
