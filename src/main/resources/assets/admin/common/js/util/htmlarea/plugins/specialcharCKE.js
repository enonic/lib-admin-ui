CKEDITOR.plugins.add('specialcharXP', {

    init: function (editor) {
        editor.ui.addButton('SpecialCharXP', {
            icon: 'specialchar',
            label: editor.lang.specialchar.toolbar,
            command: 'openSpecialCharDialog'
        });
    }
});