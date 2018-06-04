module api.app.wizard {

    import TabBarItem = api.ui.tab.TabBarItem;
    import Panel = api.ui.panel.Panel;

    export class WizardStepsPanel
        extends api.ui.panel.NavigatedPanelStrip {

        constructor(navigator: WizardStepNavigator, scrollable?: api.dom.Element) {
            super(navigator, scrollable, 'wizard-steps-panel');
        }

        insertNavigablePanel(item: TabBarItem, panel: Panel, header: string, index: number, select?: boolean): number {
            panel.onHidden(() => {
                item.hide();
            });

            panel.onShown(() => {
                item.show();
            });

            super.insertNavigablePanel(item, panel, header, index, select);

            if (item.getIconCls()) {
                this.getHeader(index).addClass('step-icon ' + item.getIconCls());
            }

            return index;
        }
    }
}
