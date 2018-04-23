CKEDITOR.plugins.add('macro', {

    init: function (editor) {
        editor.ui.addButton('Macro', {
            icon: this.path + 'images/macro.png',
            label: 'Insert macro',
            command: 'openMacroDialog'
        });
    }
});