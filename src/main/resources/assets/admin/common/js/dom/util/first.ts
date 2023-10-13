export function first(
    selector: string,
    context: Document | Element = document
) {
    return context.querySelector(selector);
}
