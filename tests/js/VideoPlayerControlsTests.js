/*
Copyright 2012 OCAD University

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://github.com/fluid-project/infusion/raw/master/Infusion-LICENSE.txt
 
 */

// Declare dependencies
/*global fluid, jqUnit, expect, jQuery, start*/

// JSLint options 
/*jslint white: true, funcinvoke: true, undef: true, newcap: true, nomen: true, regexp: true, bitwise: true, browser: true, forin: true, maxerr: 100, indent: 4 */

fluid.registerNamespace("fluid.tests");

(function ($) {
    $(document).ready(function () {

        var videoPlayerControlsTests = new jqUnit.TestCase("Video Player Controls Tests");

        var baseMenuOpts = {
            model: {
                list: [{
                    language: "klingon",
                    label: "Klingoñ",
                    type: "JSONcc",
                    src: "klingon.json"
                }, {
                    language: "esperanto",
                    label: "Espéranto",
                    type: "JSONcc",
                    src: "esperanto.json"
                }, {
                    language: "lolspeak",
                    label: "LOLspeak",
                    type: "JSONcc",
                    src: "lolspeak.json"
                }, {
                    language: "elvish",
                    label: "Elvîsh",
                    type: "JSONcc",
                    src: "elvish.json"
                }]
            }
        };

        fluid.tests.initMenu = function (testOpts) {
            var opts = fluid.copy(baseMenuOpts);
            $.extend(true, opts, testOpts);
            return fluid.videoPlayer.controllers.languageMenu("#basic-menu-test", opts);
        };

        var verifyActivation = function (actionString, that, activatedIndex) {
            // expect(5)
            var langList = that.locate("menuItem");
            jqUnit.assertEquals(actionString + " updates the active value", activatedIndex, that.model.currentTrack);
            jqUnit.assertTrue(actionString + " adds the 'active' style to the item", $(langList[activatedIndex]).hasClass(that.options.styles.active));
            jqUnit.assertEquals("Only one item is active at a time", 1, $(that.options.selectors.menuItem + "." + that.options.styles.active).length);
            jqUnit.assertFalse(actionString + " removes 'selected' style from all items", langList.hasClass(that.options.styles.selected));
            jqUnit.notVisible(actionString + " hides the menu", that.container);
        };

        var verifySelection = function (actionString, that, selectedIndex, activeIndex) {
            // expect(3)
            var langList = that.locate("menuItem");
            jqUnit.isVisible(actionString + " shows menu", that.container);
            jqUnit.assertTrue(actionString + " adds 'selected' style to the language", $(langList[selectedIndex]).hasClass(that.options.styles.selected));
            jqUnit.assertEquals(actionString + " does not update active value", activeIndex, that.model.currentTrack);
        };

        videoPlayerControlsTests.asyncTest("Language Menu: Default configuration", function () {
            var numLangs = baseMenuOpts.model.list.length;
            expect(31);
            var testMenu = fluid.tests.initMenu({
                listeners: {
                    onReady: function (that) {
                        var langList = that.locate("menuItem");
                        jqUnit.assertEquals("Menu should have correct number of items (num languages+1)", numLangs + 1, langList.length);
                        jqUnit.assertFalse("Initially, nothing should have 'selected' style", langList.hasClass(that.options.styles.selected));
                        jqUnit.assertEquals("Initially, 'no language' should be the active value", numLangs, that.model.currentTrack);
                        jqUnit.assertTrue("Initially, 'none' option should have the 'active' style", $(langList[numLangs]).hasClass(that.options.styles.active));
                        jqUnit.assertEquals("Initially, 'none' option should have the correct text", that.options.strings.languageIsOff, $(langList[numLangs]).text());

                        jqUnit.notVisible("The menu should be hidden initially", that.container);
                        that.show();
                        jqUnit.isVisible("show() shows the menu", that.container);
                        that.hide();
                        jqUnit.notVisible("hide() hides the menu", that.container);

                        that.container.fluid("selectable.select", langList[numLangs]);
                        verifySelection("Selecting the 'none' options", that, numLangs, numLangs);

                        that.container.fluid("selectable.select", langList[numLangs - 1]);
                        verifySelection("Selecting a language", that, numLangs - 1, numLangs);

                        that.activate(0);
                        verifyActivation("Activating a language", that, 0);
                        jqUnit.assertEquals("Activating a language changes the 'none' option text", that.options.strings.turnLanguageOff, $(langList[numLangs]).text());

                        that.activate(numLangs);
                        verifyActivation("Activating the 'none' option", that, numLangs);
                        jqUnit.assertEquals("Activating the 'none' option updates its text", that.options.strings.languageIsOff, $(langList[numLangs]).text());

                        that.show();
                        $(that.locate("menuItem")[1]).click();
                        verifyActivation("Clicking a language", that, 1);

                        // double-check notes on interaction between keyboard selection and hover, and add tests
                        start();
                    }
                }
            });
        });

        videoPlayerControlsTests.asyncTest("Language Menu: Custom 'none' option strings", function () {
            var numLangs = baseMenuOpts.model.list.length;
            expect(2);
            var testStrings = {
                languageIsOff: "No one is talking",
                turnLanguageOff: "Please stop all the talking!"
            };
            var testMenu = fluid.tests.initMenu({
                strings: testStrings,
                listeners: {
                    onReady: function (that) {
                        var langList = that.locate("menuItem");
                        jqUnit.assertEquals("Initially, 'none' option should have the correct custom text", testStrings.languageIsOff, $(langList[numLangs]).text());
                        that.activate(0);
                        jqUnit.assertEquals("Activating an item changes the 'none' option text to the custom text", testStrings.turnLanguageOff, $(langList[numLangs]).text());

                        start();
                    }
                }
            });
        });

        videoPlayerControlsTests.asyncTest("Language Menu: Active language on init", function () {
            var numLangs = baseMenuOpts.model.list.length;
            expect(2);
            var testMenu = fluid.tests.initMenu({
                model: {
                    currentTrack: 2
                },
                listeners: {
                    onReady: function (that) {
                        var langList = that.locate("menuItem");
                        jqUnit.assertEquals("When initialized with a choice, that choice should be the active value", 2, that.model.currentTrack);
                        jqUnit.assertTrue("The active item should have the 'active' style", $(langList[2]).hasClass(that.options.styles.active));

                        start();
                    }
                }
            });
        });
    });
})(jQuery);
