export interface Closeable {

    /*
     * Issue closing. Implementations are expected to call canClose if checkCanClose is true.
     */
    close(checkCanClose?: boolean);

    /*
     * Whether object can be closed or not.
     */
    canClose(): boolean;

    onClosed(handler: (event: any) => void);

    unClosed(handler: (event: any) => void);
}
