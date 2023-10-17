export function animateScrollTop(
    el: HTMLElement,
    targetTop: number,
    durationMs: number,
    complete: () => void
) {
    const startScrollTop = el.scrollTop;
    const distance = targetTop - startScrollTop;
    const framesPerSecond = 50;
    const timeout = 1000 / framesPerSecond;
    const intervals = durationMs / timeout;
    const step = distance / intervals;
    const timer = setInterval(() => {
        if (el.scrollTop >= targetTop) {
            clearInterval(timer);
            if (el.scrollTop > targetTop) { // Handle overshoot (decimals)
                el.scrollTop = targetTop;
            }
            complete();
        } else {
            el.scrollTop += step;
        }
    }, timeout);
}
