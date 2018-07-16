CKEDITOR.plugins.add('macro', {
    init: function (editor) {

        var selectedMacro = null;

        var regexWithBody = /\[(\w+)\s?.*\](.+)\[\/(\w+)\]/;
        var regexNoBody = /\[(\w+)\s.+\/\]/;
        var regexAttributes = /([\w]+)(?:\s*=\s*")([^"]+)(?:")/g;

        editor.addCommand('openMacroDialogNative', {
            exec: function (editor) {
                editor.execCommand('openMacroDialog', selectedMacro);
                return true;
            },

            refresh: function (editor, path) {
                selectedMacro = null;

                if (!path.lastElement) {
                    this.setState(CKEDITOR.TRISTATE_OFF);
                    return;
                }

                var content = path.lastElement.getHtml();

                if (regexWithBody.test(content)) {
                    var regexResult = regexWithBody.exec(content);

                    if (regexResult[1] !== regexResult[3]) {
                        return;
                    }

                    selectedMacro = makeMakroObject(regexResult, path.lastElement);
                    selectedMacro.body = regexResult[2];
                } else if (regexNoBody.test(content)) {
                    var regexResult = regexNoBody.exec(content);
                    selectedMacro = makeMakroObject(regexResult, path.lastElement);
                }

                this.setState(!!selectedMacro ? CKEDITOR.TRISTATE_ON : CKEDITOR.TRISTATE_OFF);
            },

            contextSensitive: 1
        });

        editor.on('doubleclick', function (evt) {
            if (selectedMacro != null) {
                editor.execCommand('openMacroDialog', selectedMacro);
            }
        });

        editor.ui.addButton('Macro', {
            icon: CKEDITOR.plugins.getPath('macro') + '/icons/macro.png',
            label: 'Insert macro',
            toolbar: 'tools,10',
            command: 'openMacroDialogNative'
        });

        function makeMakroObject(regexResult, element) {
            var attributes = [];
            var attributesString = regexResult[0].match(/\[(.*?)\]/)[1];

            var attrs;
            while (attrs = regexAttributes.exec(attributesString)) {
                attributes.push([attrs[1], attrs[2]]);
            }

            var result = {
                macroText: regexResult[0],
                name: regexResult[1],
                attributes: attributes,
                element: element
            };


            return result;
        }
    }
});