module api.ui.button {

    import ProgressBar = api.ui.ProgressBar;

    export class MenuButtonProgressBarManager {

        private static progressBar: ProgressBar;

        private static progressHandler: () => void;

        static updateProgressHandler(progressHandler: () => void) {
            if (MenuButtonProgressBarManager.progressBar) {
                MenuButtonProgressBarManager.progressBar.unClicked(MenuButtonProgressBarManager.progressHandler || (() => { /*empty*/
                }));
                MenuButtonProgressBarManager.progressHandler = progressHandler;
                MenuButtonProgressBarManager.progressBar.onClicked(MenuButtonProgressBarManager.progressHandler);
            }
        }

        static getProgressBar(): ProgressBar {
            if (!MenuButtonProgressBarManager.progressBar) {
                MenuButtonProgressBarManager.progressBar = new ProgressBar(0);
            }
            return MenuButtonProgressBarManager.progressBar;
        }
    }
}
