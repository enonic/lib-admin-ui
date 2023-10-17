export function findElements(
    selector: string,
    context: Document | Element = document
) {
    return Array.from(context.querySelectorAll(selector));
}
