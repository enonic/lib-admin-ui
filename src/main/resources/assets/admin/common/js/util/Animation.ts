export class Animation {

    private static DEFAULT_INTERVAL: number = 10;

    private duration: number;
    private interval: number;

    private doStep: (progress: number) => void;

    private id: number;
    private running: boolean = false;

    constructor(duration: number, interval: number = Animation.DEFAULT_INTERVAL) {
        this.duration = duration;
        this.interval = interval;
    }

    onStep(doStep: (progress: number) => void): void {
        this.doStep = doStep;
    }

    start(): void {
        let startTime = this.getCurrentTime();

        this.id = setInterval(() => {
            let progress = Math.min((this.getCurrentTime() - startTime) / this.duration, 1);

            if (this.doStep) {
                this.doStep(progress);
            }

            if (progress === 1) {
                this.stop();
            }
        }, this.interval);

        this.running = true;
    }

    stop(): void {
        clearInterval(this.id);

        this.running = false;
    }

    isRunning(): boolean {
        return this.running;
    }

    private getCurrentTime(): number {
        return new Date().getTime();
    }
}
