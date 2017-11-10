module api.content.util {

    import TreeNode = api.ui.treegrid.TreeNode;
    import ContentAndStatusTreeSelectorItem = api.content.resource.ContentAndStatusTreeSelectorItem;
    import Option = api.ui.selector.Option;
    import ContentTreeSelectorItem = api.content.resource.ContentTreeSelectorItem;

    export class ContentRowFormatter {

        public static nameFormatter(row: number, cell: number, value: any, columnDef: any, node: TreeNode<ContentSummaryAndCompareStatus>) {
            const data = node.getData();
            if (data.getContentSummary() || data.getUploadItem()) {
                let viewer = <ContentSummaryAndCompareStatusViewer> node.getViewer('name');
                if (!viewer) {
                    viewer = new ContentSummaryAndCompareStatusViewer();
                    node.setViewer('name', viewer);
                }
                viewer.setObject(node.getData(), node.calcLevel() > 1);
                return viewer ? viewer.toString() : '';
            }

            return '';
        }

        public static orderFormatter(row: number, cell: number, value: any, columnDef: any,
                                     node: TreeNode<ContentSummaryAndCompareStatus>) {
            let wrapper = new api.dom.SpanEl();

            if (!api.util.StringHelper.isBlank(value)) {
                wrapper.getEl().setTitle(value);
            }

            if (node.getData().getContentSummary()) {
                let childOrder = node.getData().getContentSummary().getChildOrder();
                let icon;
                if (!childOrder.isDefault()) {
                    let iconCls = 'sort-dialog-trigger ';
                    if (!childOrder.isManual()) {
                        if (childOrder.isDesc()) {
                            iconCls += childOrder.isNumeric() ? 'icon-sort-num-desc' : 'icon-sort-alpha-desc';
                        } else {
                            iconCls += childOrder.isNumeric() ? 'icon-sort-num-asc' : 'icon-sort-alpha-asc';
                        }
                    } else {
                        iconCls += 'icon-menu';
                    }

                    icon = new api.dom.DivEl(iconCls);
                    wrapper.getEl().setInnerHtml(icon.toString(), false);
                }
            }
            return wrapper.toString();
        }

        public static statusFormatter(row: number, cell: number, value: any, columnDef: any,
                                      node: TreeNode<ContentSummaryAndCompareStatus>) {

            const data = node.getData();

            return ContentRowFormatter.doStatusFormat(data, value);
        }

        public static statusSelectorFormatter(row: number, cell: number, value: ContentTreeSelectorItem, columnDef: any,
                                              node: TreeNode<Option<ContentTreeSelectorItem>>) {

            if (api.ObjectHelper.iFrameSafeInstanceOf(value, ContentAndStatusTreeSelectorItem)) {

                const item = <ContentAndStatusTreeSelectorItem>value;

                if (item.getCompareStatus() != null || item.getPublishStatus() != null) {
                    return ContentRowFormatter.doStatusFormat(
                        ContentSummaryAndCompareStatus.fromContentAndCompareAndPublishStatus(value.getContent(),
                            item.getCompareStatus(),
                            item.getPublishStatus()), item.getCompareStatus());
                }
            }

            return '';
        }

        private static doStatusFormat(data: ContentSummaryAndCompareStatus, value: any): string {

            if (data && data.getContentSummary()) {

                let status = new api.dom.SpanEl();

                status.addClass(data.getStatusClass());
                status.setHtml(data.getStatusText());

                return status.toString();

            } else if (data.getUploadItem()) { // uploading node
                const compareStatusText = new api.ui.ProgressBar(data.getUploadItem().getProgress());
                return new api.dom.SpanEl().appendChild(compareStatusText).toString();
            }
        }

        public static makeClassName(entry: string): string {
            return entry.toLowerCase().replace('_', '-').replace(' ', '_') || 'unknown';
        }
    }
}
