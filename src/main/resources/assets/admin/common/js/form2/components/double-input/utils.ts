export function getStep(value: string): number {
    const dotIndex = value.indexOf('.');
    const decimalIndex = dotIndex !== -1 ? dotIndex : value.indexOf(',');

    if (decimalIndex === -1) return 1;

    return 10 ** -(value.length - decimalIndex - 1);
}
