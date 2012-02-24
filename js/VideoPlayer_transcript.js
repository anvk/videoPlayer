/*
Copyright 2012 OCAD University

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://github.com/fluid-project/infusion/raw/master/Infusion-LICENSE.txt
*/

/*global jQuery, window, fluid*/

// JSLint options 
/*jslint white: true, funcinvoke: true, undef: true, newcap: true, nomen: true, regexp: true, bitwise: true, browser: true, forin: true, maxerr: 100, indent: 4 */


(function ($) {

    /*****************************************************************************
     *   Transcript                                                              *
     *   This component renders transcript UI, loads and displays transcripts    *
     *****************************************************************************/
    
    fluid.defaults("fluid.videoPlayer.transcript", {
        gradeNames: ["fluid.rendererComponent", "autoInit"],
        renderOnInit: true,
        rendererOptions: {
            autoBind: true
        },
        preInitFunction: "fluid.videoPlayer.transcript.preInit",
        finalInitFunction: "fluid.videoPlayer.transcript.finalInit",
        produceTree: "fluid.videoPlayer.transcript.produceTree",
        components: {
            transriptInterval: {
                type: "fluid.videoPlayer.intervalEventsConductor",
                createOnEvent: "onReady"
            }
        },
        events: {
            onTranscriptAreaShow: null,
            onTranscriptAreaHide: null,
            onTranscriptsLoaded: null,
            onLoadTranscriptError: null,
            onIntervalChange: null,
            onReady: null
        },
        model: {
            selection: undefined,
            choices: [],
            labels: []
        },
        transcripts: [],
        transcriptElementIdPrefix: "flc-videoPlayer-transcript-element",  // ToDo: Is this the right place to save this info?
        invokers: {
            convertToMilli: {
                funcName: "fluid.videoPlayer.transcript.convertToMilli",
                args: ["{arguments}.0"]
            }  
        },
        selectors: {
            langaugeDropdown: ".flc-videoPlayer-transcripts-language-dropdown",
            closeButton: ".flc-videoPlayer-transcripts-close-button",
            transcriptText: ".flc-videoPlayer-transcript-text"
        },
        selectorsToIgnore: ["closeButton", "transcriptText"],
        styles: {
            highlight: "fl-videoPlayer-transcript-element-highlight"
        }
    });

    /** Functions to show/hide the transcript area **/
    fluid.videoPlayer.transcript.showTranscriptArea = function (that) {
        // Show the transcript area
        that.container.show();
        that.events.onTranscriptAreaShow.fire();
    };
    
    // Hide the transcript area
    fluid.videoPlayer.transcript.hideTranscriptArea = function (that) {
        that.container.hide();
        that.events.onTranscriptAreaHide.fire();
    };

    // Show/Hide the transcript area based on the flag "states.displayTranscripts"
    fluid.videoPlayer.transcript.switchTranscriptArea = function (that) {
        if (that.model.displayTranscripts) {
            fluid.videoPlayer.transcript.showTranscriptArea(that);
        } else {
            fluid.videoPlayer.transcript.hideTranscriptArea(that);
        }
    };
    
    /** Functions to load and parse the transcript file **/
    /**
     * Convert the time in the format of hh:mm:ss.mmm to milliseconds.
     * The time is normally extracted from the subtitle files in WebVTT compatible format.
     * WebVTT standard for timestamp: http://dev.w3.org/html5/webvtt/#webvtt-cue-timings
     * 
     * @param time: in the format hh:mm:ss.mmm ("hh:" is optional)
     * @return a number in millisecond
     * TODO: This should be removed once capscribe desktop gives us the time in millis in the transcripts
     */
    fluid.videoPlayer.transcript.convertToMilli = function (time) {
        if (!time || !time.match(/^(\d{1,}:)?\d{2}:\d{2}\.\d{1,3}$/)) {
            return null;
        }
        
        var hourStr, minStr, secWithMilliSecStr;
        
        var splitTime = time.split(":");
        
        // Handle the optional "hh:" in the input
        if (splitTime.length === 2) {
            // "hh:" part is NOT given
            hourStr = "0";
            minStr = splitTime[0];
            secWithMilliSecStr = splitTime[1];
        } else {
            // "hh:" part is given
            hourStr = splitTime[0];
            minStr = splitTime[1];
            secWithMilliSecStr = splitTime[2];
        }
        
        var splitSec = secWithMilliSecStr.split(".");
        var hours = parseFloat(hourStr);
        var mins = parseFloat(minStr) + (hours * 60);
        var secs = parseFloat(splitSec[0]) + (mins * 60);
        return Math.round(secs * 1000 + parseInt(splitSec[1], 10));
    };

    fluid.videoPlayer.transcript.getTranscriptElementId = function (that, transcriptIndex) {
        return that.options.transcriptElementIdPrefix + "-" + that.id + "-" + transcriptIndex;
    };
    
    fluid.videoPlayer.transcript.getTranscriptElement = function (transcriptElementContent, idName) {
        return "<span id=\"" + idName + "\">" + transcriptElementContent + "</span>";
    };
    
    fluid.videoPlayer.transcript.displayTranscript = function (that, transcriptText) {
        that.locate("transcriptText").html(transcriptText);
    };
    
    fluid.videoPlayer.transcript.highlightTranscriptElement = function (that, currentTrackId, previousTrackId) {
        // Remove the highlight from the previous transcript
        if (previousTrackId !== null) {
            var previousTranscriptElementId = fluid.videoPlayer.transcript.getTranscriptElementId(that, previousTrackId);
            $("#" + previousTranscriptElementId).removeClass(that.options.styles.highlight);
        }
        // Highlight the current transcript
        if (currentTrackId !== null) {
            var currentTranscriptElementId = fluid.videoPlayer.transcript.getTranscriptElementId(that, currentTrackId);
            $("#" + currentTranscriptElementId).addClass(that.options.styles.highlight);
            
            // auto scroll the div to display the highlighted transcript element in the middle of the div
            var scrollToOffset = that.locate("transcriptText").height() / 3 * (-1);
            that.locate("transcriptText").scrollTo($("#" + currentTranscriptElementId), 1000, {offset: scrollToOffset});
        }
    };

    fluid.videoPlayer.transcript.parseTranscriptFile = function (that, transcripts, currentIndex) {
        transcripts = (typeof (transcripts) === "string") ? JSON.parse(transcripts) : transcripts;
        if (transcripts.transcriptCollection) {
            transcripts = transcripts.transcriptCollection;
        }
        
        that.options.transcripts[currentIndex].tracks = transcripts;
        
        // Generate the transcript text
        var transcriptText = "";
        for (var i = 0; i < transcripts.length; i++) {
            transcriptText = transcriptText + fluid.videoPlayer.transcript.getTranscriptElement(transcripts[i].transcript, fluid.videoPlayer.transcript.getTranscriptElementId(that, i)) + "&nbsp;";
        }
        
        that.options.transcripts[currentIndex].transcriptText = transcriptText;
        fluid.videoPlayer.transcript.displayTranscript(that, transcriptText);

        // Construct intervalList that's used by intervalEventsConductor to fire intervalChange event
        var intervalList = [];
        fluid.each(transcripts, function (value, key) {
            intervalList[key] = {
                begin: that.convertToMilli(value.inTime),
                end: that.convertToMilli(value.outTime)
            };
        });
        
        that.events.onTranscriptsLoaded.fire(intervalList);
    };  
    
    fluid.videoPlayer.transcript.loadTranscript = function (that, currentIndex) {
        var transcriptSource = that.options.transcripts[currentIndex];
        if (transcriptSource) {
            var opts = {
                type: "GET",
                dataType: "text",
                success: function (data) {
                    fluid.videoPlayer.transcript.parseTranscriptFile(that, data, currentIndex);
                },
                error: function () {
                    fluid.log("Error loading transcript: " + transcriptSource.src + ". Are you sure this file exists?");
                    that.events.onLoadTranscriptError.fire(transcriptSource);
                }
            };
            if (transcriptSource.type !== "JSONcc") {
                opts.url = that.model.conversionServiceUrl;
                opts.data = {
                    cc_result: 0,
                    cc_url: transcriptSource.src,
                    cc_target: "JSONcc",
                    cc_name: "__no_name"
                };
            } else {
                opts.url = transcriptSource.src;
                
            }
            $.ajax(opts);
        }
    };

    fluid.videoPlayer.transcript.prepareTranscript = function (that) {
        // Transcript display only supports one language at a time
        // Exit if the current transcript is not chosen
        if (that.model.currentTracks.transcripts.length == 0) {
            return true;
        }
        
        var currentTranscriptIndex = parseInt(that.model.currentTracks.transcripts[0], 10);
        var currentTranscript = that.options.transcripts[currentTranscriptIndex];
        
        if (that.options.transcripts.length === 0 || !currentTranscript) {
            return true;
        }
        
        // Load the transcript only if it's never been loaded before
        if (currentTranscript.transcriptText) {
            fluid.videoPlayer.transcript.displayTranscript(that, currentTranscript.transcriptText);
        } else {
            fluid.videoPlayer.transcript.loadTranscript(that, currentTranscriptIndex);
        }
    };
    
    fluid.videoPlayer.transcript.bindTranscriptDOMEvents = function (that) {
        that.locate("closeButton").click(function () {
            that.applier.requestChange("displayTranscripts", false);
        });
    };

    fluid.videoPlayer.transcript.bindTranscriptModel = function (that) {
        that.applier.modelChanged.addListener("displayTranscripts", function () {
            fluid.videoPlayer.transcript.switchTranscriptArea(that);
        });

        that.applier.modelChanged.addListener("currentTracks.transcripts", function () {
            fluid.videoPlayer.transcript.prepareTranscript(that);
        });
        
        that.events.onTranscriptsLoaded.addListener(function (intervalList) {
            that.transriptInterval.setIntervalList(intervalList);
        });
        
        that.events.onIntervalChange.addListener(function (currentInterval, previousInterval) {
            fluid.videoPlayer.transcript.highlightTranscriptElement(that, currentInterval, previousInterval);
        });
    };

    fluid.videoPlayer.transcript.preInit = function (that) {
        // build the 'choices' from the transcript list provided
        fluid.each(that.options.transcripts, function (value, key) {
            // ToDo: convert the integer to string to avoid the "unrecognized text" error at rendering dropdown list box
            // The integer is converted back at the listener for currentTracks.transcripts.0. Needs a better solution for this.
            that.options.model.choices.push(key.toString());
            that.options.model.labels.push(value.label);
        });
    };
    
    fluid.videoPlayer.transcript.produceTree = function (that) {
        if (that.model.choices.length === 0 || that.model.labels.length === 0) {
            return {};
        }
        
        return {
            langaugeDropdown: {
                selection: "${currentTracks.transcripts.0}",
                optionlist: "${choices}",
                optionnames: "${labels}"
            }
        };
    };
    
    fluid.videoPlayer.transcript.finalInit = function (that) {
        fluid.videoPlayer.transcript.bindTranscriptDOMEvents(that);
        fluid.videoPlayer.transcript.bindTranscriptModel(that);
        
        fluid.videoPlayer.transcript.prepareTranscript(that);
        fluid.videoPlayer.transcript.switchTranscriptArea(that);

        that.events.onReady.fire(that);
    };

})(jQuery);
