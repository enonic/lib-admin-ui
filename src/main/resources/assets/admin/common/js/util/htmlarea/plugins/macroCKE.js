CKEDITOR.plugins.add('macro', {
    init: function (editor) {

        var selectedMacro = null;
        var selectedElement = null;

        editor.addCommand('openMacroDialogNative', {
            exec: function (editor) {
                editor.execCommand('openMacroDialog', selectedMacro);
                return true;
            },

            refresh: function (editor, path) {
                selectedMacro = null;
                selectedElement = path.lastElement;

                var range = editor.getSelection().getRanges()[0];

                if (!path.lastElement || !range.startContainer.equals(range.endContainer)) {
                    updateButtonState();
                    return;
                }

                var regexMacroWithBody = /\[(\w+)\s?.*?\](.+?)\[\/(\w+)\]/g;
                var content = path.lastElement.getText();

                var result;
                while (result = regexMacroWithBody.exec(content)) {
                    if (result[1] === result[3] && range.startOffset > result.index &&
                        range.endOffset < (result.index + result[0].length)) {
                        selectedMacro = makeMakroObject(result, path.lastElement);
                        selectedMacro.body = result[2];
                        break;
                    }
                }

                if (!!selectedMacro) {
                    updateButtonState();
                    return;
                }

                var regexMacroNoBody = /\[(\w+)\s.+?\/\]/g;

                while (result = regexMacroNoBody.exec(content)) {
                    if (range.startOffset > result.index && range.endOffset < (result.index + result[0].length)) {
                        selectedMacro = makeMakroObject(result, path.lastElement);
                        break;
                    }
                }

                updateButtonState();
            },

            contextSensitive: 1
        });

        editor.on('doubleclick', function () {
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

        /**
         *  selectionChange() event is triggered by CKE only when selected element changes (for performance purposes)
         *  thus selection change within same element doesn't trigger our refresh() method;
         *  Handling clicks/navigation keys within same element ourselves and triggering selectionChange()
         */
        editor.on('instanceReady', function () {
            editor.editable().on('click', function () {
                if (editor.elementPath().lastElement.equals(selectedElement)) {
                    editor.fire("selectionChange", {selection: editor.getSelection(), path: editor.elementPath()});
                }
            });

            editor.on('key', function (e) {
                var key = e.data.keyCode;

                if (key === 37 || key === 38 || key === 39 || key === 40) { // navigation keys: left, top, right, bottom
                    if (editor.elementPath().lastElement.equals(selectedElement)) {
                        editor.fire("selectionChange", {selection: editor.getSelection(), path: editor.elementPath()});
                    }
                }
            });
        });

        function makeMakroObject(regexResult, element) {
            var regexMacroAttributes = /([\w]+)(?:\s*=\s*")([^"]+)(?:")/g;
            var attributes = [];
            var attributesString = regexResult[0].match(/\[(.*?)\]/)[1];

            var attrs;
            while (attrs = regexMacroAttributes.exec(attributesString)) {
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

        function updateButtonState() {
            this.setState(!!selectedMacro ? CKEDITOR.TRISTATE_ON : CKEDITOR.TRISTATE_OFF);
        }
    }
});