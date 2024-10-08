import {DialogStep} from './DialogStep';
import {Element} from '../../../dom/Element';
import * as Q from 'q';
import {ActionButton} from '../../button/ActionButton';
import {DivEl} from '../../../dom/DivEl';
import {i18n} from '../../../util/Messages';
import {Action} from '../../Action';
import {AppHelper} from '../../../util/AppHelper';
import {DefaultErrorHandler} from '../../../DefaultErrorHandler';
import {NamesAndIconView, NamesAndIconViewBuilder} from '../../../app/NamesAndIconView';
import {NamesAndIconViewSize} from '../../../app/NamesAndIconViewSize';
import {ModalDialogWithConfirmation, ModalDialogWithConfirmationConfig} from '../ModalDialogWithConfirmation';

export interface MultiStepDialogConfig
    extends ModalDialogWithConfirmationConfig {

    steps: DialogStep[];

    submitCallback?: () => void;

    keepOpenOnSubmit?: boolean;
}

export class MultiStepDialog
    extends ModalDialogWithConfirmation {

    protected steps: DialogStep[];

    protected config: MultiStepDialogConfig;

    protected currentStep: DialogStep;

    private stepsContainer: Element;

    protected headerContent: NamesAndIconView;

    private forwardAction: Action;

    private backAction: Action;

    private noStepsBlock?: Element;

    private currentStepDataChangedHandler: () => void;

    protected initElements(): void {
        super.initElements();

        this.steps = this.config.steps;
        this.stepsContainer = this.createStepsContainer();
        this.addAction(this.backAction = new Action(this.getBackButtonLabel()));
        this.addAction(this.forwardAction = new Action(this.getForwardButtonLabel()));
        this.headerContent = this.createHeaderContent();
    }

    protected createStepsContainer(): Element {
        return new DivEl();
    }

    protected getBackButtonLabel(): string {
        return i18n('dialog.multistep.previous');
    }

    protected getForwardButtonLabel(): string {
        return i18n('action.next');
    }

    setHeading(value: string): void {
        this.headerContent.setMainName(value);
    }

    protected initListeners(): void {
        super.initListeners();

        this.whenShown(() => {
            this.handleShown();
        });

        this.onHidden(() => {
            this.handleHidden();
        });

        this.forwardAction.onExecuted(() => {
            if (this.forwardAction.isEnabled()) {
                this.forwardOrSubmit();
            }
        });

        this.backAction.onExecuted(() => {
            this.showPreviousStep();
        });

        this.currentStepDataChangedHandler = AppHelper.debounce(this.handleCurrentStepDataChanged.bind(this), 300);
    }

    protected forwardOrSubmit(): void {
        if (this.isLastStep()) {
            this.submit();
        } else {
            this.showNextStep();
        }
    }

    protected isLastStep(): boolean {
        return this.currentStep && this.currentStep === this.steps.slice().pop();
    }

    protected isFirstStep(): boolean {
        return this.currentStep === this.steps[0];
    }

    protected submit(): void {
        if (this.config.submitCallback) {
            this.config.submitCallback();
        }

        if (!this.config.keepOpenOnSubmit) {
            this.close();
        }
    }

    protected handleShown(): void {
        if (this.steps.length > 0) {
            this.showNextStep();
        } else {
            this.handleNoSteps();
        }
    }

    protected showNextStep(): void {
        this.showStep(this.getNextStep());
    }

    protected showStep(step: DialogStep): void {
        this.unbindCurrentStepEvents();
        this.displayStep(step).then(() => {
            this.updateButtonsState();
            this.bindCurrentStepEvents();
        });
    }

    private unbindCurrentStepEvents(): void {
        this.currentStep?.unDataChanged(this.currentStepDataChangedHandler);
    }

    private bindCurrentStepEvents(): void {
        this.currentStep?.onDataChanged(this.currentStepDataChangedHandler);
    }

    private getCurrentStepNumber(): number {
        let stepNumber: number = -1;

        this.steps.some((step: DialogStep, index: number) => {
            if (step === this.currentStep) {
                stepNumber = ++index;
                return true;
            }
            return false;
        });

        return stepNumber;
    }

    protected handleCurrentStepDataChanged(): void {
        this.updateForwardButtonLabel();
        this.updateForwardButtonEnabledState();
    }

    protected displayStep(step: DialogStep): Q.Promise<any> {
        this.currentStep?.getHtmlEl().hide();
        this.currentStep = step;

        const el: Element = step.getHtmlEl();

        if (!this.stepsContainer.hasChild(el)) {
            this.stepsContainer.appendChild(el);
        }

        this.updateSubTitle();

        el.show();

        return Q(null);
    }

    protected updateSubTitle(): void {
        const stepNumber: number = this.getCurrentStepNumber();
        const totalSteps: number = this.steps.length;
        const stepCount: string = i18n('dialog.multistep.step.counter', stepNumber, totalSteps);
        const description: string = this.currentStep.getDescription() ? ` - ${this.currentStep.getDescription()}` : '';
        this.headerContent.setSubName(`${stepCount}${description}`);
    }

    private getNextStep(): DialogStep {
        if (!this.currentStep) {
            return this.steps[0];
        }

        const nextStep: DialogStep = this.steps.find((step: DialogStep, index: number) => {
            return this.currentStep === this.steps[index - 1];
        });

        return nextStep || this.steps[0];
    }

    private updateButtonsState(): void {
        this.getButtonRow().toggleClass('first-step', this.isFirstStep());
        this.updateForwardButtonLabel();
        this.updateForwardButtonEnabledState();
    }

    private updateForwardButtonLabel(): void {
        this.forwardAction.setLabel(this.getForwardButtonLabelDependingOnState());
    }

    private getForwardButtonLabelDependingOnState(): string {
        if (this.isLastStep()) {
            return this.getSubmitActionLabel();
        }

        if (!this.currentStep.isOptional() || this.currentStep.hasData()) {
            return this.getForwardButtonLabel();
        }

        return this.getSkipButtonLabel();
    }

    protected getSkipButtonLabel(): string {
        return i18n('dialog.multistep.skip');
    }

    private updateForwardButtonEnabledState(): void {
        if (this.currentStep.isOptional()) {
            this.forwardAction.setEnabled(true);
        } else {
            this.forwardAction.setEnabled(false);
            this.lock();

            this.currentStep.isValid().then((isValid: boolean) => {
                this.forwardAction.setEnabled(isValid);
            })
                .catch(DefaultErrorHandler.handle)
                .finally(() => this.unlock());
        }
    }

    protected lock(): void {
        this.addClass('locked');
    }

    protected unlock(): void {
        this.removeClass('locked');
    }

    private getPreviousStep(): DialogStep {
        if (!this.currentStep) {
            return this.steps[0];
        }

        const previousStep: DialogStep = this.steps.find((step: DialogStep, index: number) => {
            return this.currentStep === this.steps[index + 1];
        });

        return previousStep || this.steps[0];
    }

    protected showPreviousStep(): void {
        this.showStep(this.getPreviousStep());
    }

    protected handleNoSteps(): void {
        if (!this.noStepsBlock) {
            this.noStepsBlock = new DivEl('no-steps-block').setHtml(i18n('dialog.multistep.no.steps'));
        }

        this.backAction.setVisible(false);
        this.forwardAction.setVisible(false);
        this.appendChildToContentPanel(this.noStepsBlock);
    }

    protected handleHidden(): void {
        //
    }

    protected getSubmitActionLabel(): string {
        return i18n('action.submit');
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.addClass('multi-step-dialog');
            this.appendChildToHeader(this.headerContent);
            this.stepsContainer.addClass('steps-container');
            this.appendChildToContentPanel(this.stepsContainer);
            this.backAction.setClass('back');
            this.forwardAction.setClass('forward');

            return rendered;
        });
    }

    protected createHeaderContent(): NamesAndIconView {
        return new NamesAndIconViewBuilder()
            .setSize(NamesAndIconViewSize.medium)
            .build()
            .setMainName(this.config.title)
            .addClass('no-icon') as NamesAndIconView;
    }

    protected toggleHeaderIcon(value: boolean): void {
        this.headerContent.toggleClass('no-icon', !value);
    }

    isDirty(): boolean {
        return this.steps.some((step: DialogStep) => step.hasData());
    }
}
