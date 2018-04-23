﻿/*
 Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
*/
CKEDITOR.plugins.setLang("a11yhelp", "eo", {
    title: "Uzindikoj pri atingeblo",
    contents: "Helpilenhavo. Por fermi tiun dialogon, premu la ESKAPAN klavon.",
    legend: [{
        name: "Ĝeneralaĵoj",
        items: [{
            name: "Ilbreto de la redaktilo",
            legend: "Premu ${toolbarFocus} por atingi la ilbreton. Moviĝu al la sekva aŭ antaŭa grupoj de la ilbreto per la klavoj TABA kaj MAJUSKLIGA+TABA. Moviĝu al la sekva aŭ antaŭa butonoj de la ilbreto per la klavoj SAGO DEKSTREN kaj SAGO MALDEKSTREN. Premu la SPACETklavon aŭ la ENENklavon por aktivigi la ilbretbutonon."
        },
            {
                name: "Redaktildialogo",
                legend: "En dialogo, premu la TABAN klavon por navigi al la sekva dialogelemento, premu la MAJUSKLIGAN+TABAN klavon por iri al la antaŭa dialogelemento, premu la ENEN klavon por sendi la dialogon, premu la ESKAPAN klavon por nuligi la dialogon. Kiam dialogo havas multajn langetojn, eblas atingi la langetliston aŭ per ALT+F10 aŭ per la TABA klavo kiel parton de la dialoga taba ordo. En langetlisto, moviĝu al la sekva kaj antaŭa langeto per la klavoj SAGO DEKSTREN KAJ MALDEKSTREN respektive."
            },
            {
                name: "Kunteksta menuo de la redaktilo",
                legend: "Premu ${contextMenu} aŭ entajpu la KLAVKOMBINAĴON por malfermi la kuntekstan menuon. Poste moviĝu al la sekva opcio de la menuo per la klavoj TABA aŭ SAGO SUBEN. Moviĝu al la antaŭa opcio per la klavoj MAJUSKLGA + TABA aŭ SAGO SUPREN. Premu la SPACETklavon aŭ ENENklavon por selekti la menuopcion. Malfermu la submenuon de la kuranta opcio per la SPACETklavo aŭ la ENENklavo aŭ la SAGO DEKSTREN. Revenu al la elemento de la patra menuo per la klavoj ESKAPA aŭ SAGO MALDEKSTREN. Fermu la kuntekstan menuon per la ESKAPA klavo."
            },
            {
                name: "Fallisto de la redaktilo",
                legend: "En fallisto, moviĝu al la sekva listelemento per la klavoj TABA aŭ SAGO SUBEN. Moviĝu al la antaŭa listelemento per la klavoj MAJUSKLIGA+TABA aŭ SAGO SUPREN. Premu la SPACETklavon aŭ ENENklavon por selekti la opcion en la listo. Premu la ESKAPAN klavon por fermi la falmenuon."
            }, {
                name: "Breto indikanta la vojon al la redaktilelementoj",
                legend: "Premu ${elementsPathFocus} por navigi al la breto indikanta la vojon al la redaktilelementoj. Moviĝu al la butono de la sekva elemento per la klavoj TABA aŭ SAGO DEKSTREN. Moviĝu al la butono de la antaŭa elemento per la klavoj MAJUSKLIGA+TABA aŭ SAGO MALDEKSTREN. Premu la SPACETklavon aŭ ENENklavon por selekti la elementon en la redaktilo."
            }]
    },
        {
            name: "Komandoj",
            items: [{name: "Komando malfari", legend: "Premu ${undo}"}, {name: "Komando refari", legend: "Premu ${redo}"},
                {name: "Komando grasa", legend: "Premu ${bold}"}, {name: "Komando kursiva", legend: "Premu ${italic}"},
                {name: "Komando substreki", legend: "Premu ${underline}"}, {name: "Komando ligilo", legend: "Premu ${link}"},
                {name: "Komando faldi la ilbreton", legend: "Premu ${toolbarCollapse}"}, {
                    name: "Komando por atingi la antaŭan fokusan spacon",
                    legend: "Press ${accessPreviousSpace} por atingi la plej proksiman neatingeblan fokusan spacon antaŭ la kursoro, ekzemple : du kuntuŝiĝajn HR elementojn. Ripetu la klavkombinaĵon por atingi malproksimajn fokusajn spacojn."
                },
                {
                    name: "Komando por atingi la sekvan fokusan spacon",
                    legend: "Press ${accessNextSpace} por atingi la plej proksiman neatingeblan fokusan spacon post la kursoro, ekzemple : du kuntuŝiĝajn HR elementojn. Ripetu la klavkombinajôn por atingi malproksimajn fokusajn spacojn"
                }, {name: "Helpilo pri atingeblo", legend: "Premu ${a11yHelp}"},
                {name: " Paste as plain text", legend: "Press ${pastetext}", legendEdge: "Press ${pastetext}, followed by ${paste}"}]
        }],
    tab: "Tabo",
    pause: "Paŭzo",
    capslock: "Majuskla baskulo",
    escape: "Eskapa klavo",
    pageUp: "Antaŭa Paĝo",
    pageDown: "Sekva Paĝo",
    leftArrow: "Sago Maldekstren",
    upArrow: "Sago Supren",
    rightArrow: "Sago Dekstren",
    downArrow: "Sago Suben",
    insert: "Enmeti",
    leftWindowKey: "Maldekstra Windows-klavo",
    rightWindowKey: "Dekstra Windows-klavo",
    selectKey: "Selektklavo",
    numpad0: "Nombra Klavaro 0",
    numpad1: "Nombra Klavaro 1",
    numpad2: "Nombra Klavaro 2",
    numpad3: "Nombra Klavaro 3",
    numpad4: "Nombra Klavaro 4",
    numpad5: "Nombra Klavaro 5",
    numpad6: "Nombra Klavaro 6",
    numpad7: "Nombra Klavaro 7",
    numpad8: "Nombra Klavaro 8",
    numpad9: "Nombra Klavaro 9",
    multiply: "Obligi",
    add: "Almeti",
    subtract: "Subtrahi",
    decimalPoint: "Dekuma Punkto",
    divide: "Dividi",
    f1: "F1",
    f2: "F2",
    f3: "F3",
    f4: "F4",
    f5: "F5",
    f6: "F6",
    f7: "F7",
    f8: "F8",
    f9: "F9",
    f10: "F10",
    f11: "F11",
    f12: "F12",
    numLock: "Nombra Baskulo",
    scrollLock: "Ruluma Baskulo",
    semiColon: "Punktokomo",
    equalSign: "Egalsigno",
    comma: "Komo",
    dash: "Haltostreko",
    period: "Punkto",
    forwardSlash: "Oblikvo",
    graveAccent: "Malakuto",
    openBracket: "Malferma Krampo",
    backSlash: "Retroklino",
    closeBracket: "Ferma Krampo",
    singleQuote: "Citilo"
});