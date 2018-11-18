function updateText(log, searchStr, color) {

    return log.replace(new RegExp(searchStr, 'g'), '<mark style="background-color: ' + color + ';">' + searchStr + '</mark>');
}

function updateTextCSS(log, searchStr, css) {
    return log.replace(new RegExp(searchStr, 'g'), '<mark style="' + css + ';">' + searchStr + '</mark>');
}

function newLineText(log, searchStr) {
    return log.replace(new RegExp(searchStr, 'g'), '<br>' + searchStr);
}

function searchJson(log, counter) {
    //console.log("searchJson");
    var myJson = new Object();
    myJson.start = log.indexOf("{", counter);
    if (myJson.start < 0) {
        myJson.close = -1;
        return myJson;
    }
    var counters = new Object();
    counters.open = 1;
    counters.close = 0;
    counters.str = myJson.start + 1;
    do {
        if (log.indexOf("{", counters.str) > 0) {
            if (log.indexOf("}", counters.str) < log.indexOf("{", counters.str)) {
                counters.str = log.indexOf("}", counters.str) + 1;
                counters.close++;
                //console.log("strCounter {} close {} open {}", counters.str, close, open);

            } else {
                counters.open++;
                counters.str = log.indexOf("{", counters.str) + 1;
                // console.log("strCounter {} close {} open {}", counters.str, close, open);
            }
        } else {
            if (log.indexOf("}", counters.str) > 0 && myJson.start > 0) {
                counters.str = log.indexOf("}", counters.str) + 1;
                counters.close++;
            } else {
                return myJson;
            }
        }
    } while (counters.open != counters.close || counters.str < 0);
    var jsonWithBackslash = log.substr(myJson.start, counters.str - myJson.start);
    // escape Backslashes for parsing
    jsonWithBackslash = encodeURI(jsonWithBackslash);
    jsonWithBackslash = jsonWithBackslash.replace(/%5C/g,"%5C%5C");
    jsonWithBackslash = decodeURI(jsonWithBackslash);
    myJson.json = JSON.parse(jsonWithBackslash);
    myJson.counters = counters;
    myJson.close = counters.str;
    // console.log(myJson.json);
    return myJson;
    //search first {, count all open { and close } till -> 0 -> try to parse json
    //save json in var, remove it from string, add pre with id to str
    //http://jsfiddle.net/K83cK/
}




function useJson(log) {
    var jsonObj = [];
    var counter = 0;
    do {
        if (counter == 0) {
            jsonObj[counter++] = searchJson(log, 0);
        } else {
            var weiterfahren = jsonObj[counter - 1].close + 1;
            jsonObj[counter++] = searchJson(log, weiterfahren);
        }
    } while (jsonObj[counter - 1].close > 0)
    // remove last unsuccessful element
    jsonObj.pop();
    return jsonObj;
}

function prettyPrintJsons(text, jsons) {
    var newHtml = text;
    // start with last, to be sure char count is correct by all objects
    for (var i = jsons.length; i > 0; i--) {
        var endStr = newHtml.substr(jsons[i - 1].close);
        var startStr = newHtml.substr(0, jsons[i - 1].start);
        newHtml = startStr + '<div id="json' + (i - 1) + '"></div>' + endStr;
    }
    $('#output').html(newHtml);
    for (var i = 0; i < jsons.length; i++) {
        // https://www.jqueryscript.net/other/jQuery-Based-Pretty-Collapsible-JSON-Tree-Viewer.html
        $("#json" + i).jsonView(jsons[i].json);
    }
}

$(document).ready(function () {
    $("#analyze-button").click(function () {
        var text = $('#log-comment').val();
        prettyPrintJsons(text, useJson(text, 0));
        text = $('#output').html();
        var lines = $('#mark-comment').val().split('\n');
        if ($('#mark-comment').val().length > 0) {
            for (var i = 0; i < lines.length; i++) {
                var splitCommands = lines[i].split("=");
                if (splitCommands[1] == "NEWLINE") {
                    text = newLineText(text, splitCommands[0]);
                } else if (splitCommands[1] == "CSS" && splitCommands.length > 2) {
                    text = updateTextCSS(text, splitCommands[0], splitCommands[2]);
                    //console.log("CSS: "+text);
                } else {
                    text = updateText(text, splitCommands[0], splitCommands[1]);
                }
            }
        }
        $('#output').html(text);
    });
});