/**
 * Namespacing
 * From: Stoyan Stefanov: "JavaScript Patterns", O'Reilly, 2010
 */
var fim = fim || {}; 
fim.namespace = function(ns) {
    'use strict';
    var parts = ns.split('.'),
        parent = fim,
        i;
    if (parts[0] === 'fim') {
        parts = parts.slice(1);
    }   
    for (i=0; i<parts.length; i++) {
        if (typeof(parent[parts[i]]) === 'undefined') {
            parent[parts[i]] = {}; 
        }
        parent = parent[parts[i]];
    }   
    return parent;
};

fim.namespace('fim.klausumatic.untagged');
(function(){
    "use strict";
    fim.klausumatic.untagged.refresh = refresh,
    fim.klausumatic.untagged.show = show,
    fim.klausumatic.untagged.hide = hide;
    fim.klausumatic.untagged.skip = skip;
    fim.klausumatic.untagged.tagCurrent = tagCurrent;
    fim.klausumatic.untagged.successMessageClosure = successMessageClosure;

    var refreshUrl = "/klausurdb/list_untagged",
        postUrl = "/klausurdb/metadata/",
        untaggedSel = "#untagged",
        list,
        currentSelection,
        firstRefresh = true;

    function show() {
        $(untaggedSel).fadeIn();
    }

    function hide() {
        $(untaggedSel).fadeOut();
    }

    function refresh() {
        var ul = $(untaggedSel + " ul");
        ul.empty();
        $("<li>loading...</li>").appendTo(ul);
        $.get(refreshUrl, refreshHandler);
    }

    function refreshHandler(data) {
        var ul = $(untaggedSel + " ul"),
            currentLi;
        ul.empty();
        list = data;
        for (var i=0; i<data.length; i++) {
            currentLi = $("<li>" + data[i].name + "</li>")
            currentLi.click(clickHandlerClosure(data[i].id, data[i].name));
            currentLi.appendTo(ul)
        }
        if (firstRefresh) {
            firstRefresh = false;
            if (list.length > 0) {
                fim.klausumatic.editor.setCurrent(list[0].id, list[0].name);
                currentSelection = list[0].id;
            }
        }
    }

    function clickHandlerClosure(id, name) {
        return function clickHandler() {
            fim.klausumatic.editor.setCurrent(id, name);
            fim.klausumatic.upload.hide();
            fim.klausumatic.editor.show();
            currentSelection = id;
        }
    }

    function skip() {
        var next = false,
            i;

        for (i=0; i<list.length; i++) {
            if (next) {
                clickHandlerClosure(list[i].id, list[i].name)();
                return;
            } else {
                if (list[i].id === currentSelection) {
                    next = true;
                }
            }
        }
        if (list.length > 0) {
            clickHandlerClosure(list[0].id, list[0].name)();
        } else {
            fim.klausumatic.editor.hide();
            fim.klausumatic.upload.show();
        }
    }

    function removeCurrentFromList() {
        var lis = $(untaggedSel).find("li"),
            i,
            removeId;

        for (i=0; i<list.length; i++) {
            if (list[i].id === currentSelection) {
                removeId = i;
                break;
            }
        }
        $(lis[removeId]).detach();
        list.splice(removeId, 1);
        return removeId;
    }

    function successMessageClosure(msg) {
        return function() {
            var bubble = $('<div class="bubble"><p class="head">SUCCESS</p>' +
                msg + '</div>');
            bubble.hide();
            bubble.appendTo("body");
            bubble.fadeIn();

            function createFadeoutClosure(bubble) {
                return function() {
                    bubble.fadeOut();
                }
            }
            function createDeleteClosure(bubble) {
                return function() {
                    bubble.detach();
                }
            }
            window.setTimeout(createFadeoutClosure(bubble), 2000);
            window.setTimeout(createDeleteClosure(bubble), 3000);
        }
    }

    function tagCurrent(subject, professor, year, hws, degree, note, solution) {
        var data, showId;
    
        data = {
            "subject": subject,
            "professor": professor,
            "year": year,
            "hws": hws,
            "degree": degree,
            "note": note,
            "solution": solution
        }
        $.post(postUrl + currentSelection, data, successMessageClosure(
                'Changes to &quot;' + data.subject+'&quot; by &quot;' + 
                data.professor + '&quot; saved.</div>'));
        showId = removeCurrentFromList(); 
        if (list.length > 0) {
            if (showId > list.length-1) {
                showId = list.length-1;
            }
            clickHandlerClosure(list[showId].id, list[showId].name)();
        } else {
            fim.klausumatic.editor.hide();
            fim.klausumatic.upload.show();
        }
    }
}());

fim.namespace('fim.klausumatic.editor');
(function(){
    "use strict";

    fim.klausumatic.editor.init = init;
    fim.klausumatic.editor.setCurrent = setCurrent;
    fim.klausumatic.editor.show = show;
    fim.klausumatic.editor.hide = hide;
    fim.klausumatic.editor.save = save; 


    var profsUrl = "/klausurdb/professors",
        subsUrl = "/klausurdb/subjects",
        degreesUrl = "/klausurdb/degrees",
        editorSel = "#editor",
        imgSel = "#image",
        titleSel = "#filename",
        imgUrl = "/klausurdb/image/",
        professorSel = "#professor",
        subjectSel = "#subject",
        degreeSel = "#degree",
        yearSel = "#year",
        hwsSel = "#hws",
        noteSel = "#note",
        solutionSel = "#solution",
        uploadSel = "#upload",
        downloadSel = "#download",
        downloadUrl = "/klausurdb/file/",
        currentId;

    function init() {
        // download autocomplete data and enable 
        downloadAndAutocomplete(professorSel, profsUrl);
        downloadAndAutocomplete(subjectSel, subsUrl);
        downloadAndAutocomplete(degreeSel, degreesUrl);
    }

    function save() {
        var professor, subject, degree, year, hws, note, solution;

        professor = $(professorSel)[0].value;
        subject = $(subjectSel)[0].value;
        year = $(yearSel)[0].value;
        note = $(noteSel)[0].value;
        degree = $(degreeSel)[0].value;
        hws = $(hwsSel)[0].checked;
        solution = $(solutionSel)[0].checked;

        fim.klausumatic.untagged.tagCurrent(subject, professor, year,
            hws, degree, note, solution);
    }
    
    function show() {
        $(uploadSel).hide();
        $(editorSel).fadeIn();
    }

    function hide() {
        $(editorSel).fadeOut();
    }

    function setCurrent(id, name) {
        var img = imgUrl + id,
            parsed;

        currentId = id;
        $(imgSel).html(
            '<a href=' + img + ' target="_new"><img src="' + img + '"></a>');
        $(titleSel).html(": " + name);
        $(downloadSel).attr("href", downloadUrl + id);
        clearInputFields();
        parsed = fim.klausumatic.fn.parse(name);
        if (typeof(parsed) !== "undefined") {
            $(professorSel)[0].value = parsed["professor"];
            $(degreeSel)[0].value = parsed["degree"];
            $(yearSel)[0].value = parsed["year"];
            $(subjectSel)[0].value = parsed["subject"];
            if (typeof(parsed["note"]) !== "undefined") {
                $(noteSel)[0].value = parsed["note"];
            }
            if (parsed["hws"] === true) {
                $(hwsSel)[0].checked = true;
            }
            if (parsed["solution"] === true) {
                $(solutionSel)[0].checked = true;
            }
        }
    }

    function clearInputFields() {
        var inputs = $(editorSel).find('input'),
            i;

        for (i=0; i<inputs.length; i++) {
            if (inputs[i].type === "text") {
                inputs[i].value = "";
            }
            if (inputs[i].type === "checkbox") {
                inputs[i].checked = false;
            }
        }
    }

    function enableAutocompleteClosure(textbox) {
        return function(elements) {
            enableCompletion(textbox, elements);
        }
    }
    
    function downloadAndAutocomplete(textbox, url) {
        var handler = enableAutocompleteClosure(textbox);
        $.get(url, handler);
    }

    function enableCompletion(textbox, elements) {
        $(textbox).autocompleteArray(elements,
        {
            delay: 10,
            minChars: 1,
            matchSubset: 1,
            autoFill: true,
            maxItemsToShow: 10
        });
    }
}());


fim.namespace('fim.klausumatic.upload');
(function(){
    "use strict";
    fim.klausumatic.upload.show = show;
    fim.klausumatic.upload.hide = hide;
    fim.klausumatic.upload.init = init;
    
    var uploadSel = "#upload",
        editorSel = "#editor",
        progressSel = "#upload_in_progress",
        speedSel = "#speed",
        uploadUrl = "/klausurdb/file/new",
        maxFiles = 20,
        maxFileSize = 10,
        currentUploadOK = 0,
        currentUploadDuplicate = 0;


    function show() {
        $(editorSel).hide();
        $(uploadSel).fadeIn();
    }

    function hide() {
        $(uploadSel).fadeOut();
    }

    function init() {
        $(uploadSel).filedrop({
            "fallback_id": "file",
            "url": uploadUrl,
            "paramname": "file",
            withCredentials: false,
            error: function(err, file) {
                switch (err) {
                    case 'BrowserNotSupported':
                        errorMessageClosure("Your browser does not support " +
                            "HTML5 drag and drop. Please use the regular button.")();
                        break;
                    case 'TooManyFiles':
                        errorMessageClosure("Please don't try to upload more than " + 
                            maxFiles + " files at once.")();
                        break;
                    case 'FileTooLarge':
                        errorMessageClosure("File " + file.name +
                            " exceeds the maximum file size of " + 
                            maxFileSize+ "MB.")();
                        break;
                    case 'FileTypeNotAllowed':
                        errorMessageClosure("Please upload PDF files only.")();
                        break;
                    default:
                        break;
                }
            },
            allowedfiletypes: ['application/pdf'],
            maxfiles: maxFiles,
            maxfilesize: maxFileSize,
            dragOver: function() {
                $(uploadSel).addClass("drop"); 
            },
            dragLeave: function() {
                $(uploadSel).removeClass("drop"); 
            },
            drop: function() {
                $(uploadSel).removeClass("drop"); 
            },
            uploadStarted: function(i, file, len) {
                $(uploadSel).hide();
                $(progressSel).fadeIn();
                fim.klausumatic.untagged.successMessageClosure(
                    "Uploading "+len+" file(s).")();
            },
            uploadFinished: function(i, file, response, time) {
                if (response == "DUPLICATE") {
                    currentUploadDuplicate++;
                } else {
                    if (response == "OK") {
                        currentUploadOK++;
                    }
                }
            },
            globalProgressUpdated: function(progress) {
                if (progress === 100) {
                    resetStatus();
                } else {
                    setStatus(progress);
                }
            },
            speedUpdated: function(i, file, speed) {
                var s = Math.round(speed);
               $(speedSel).html(s + " kB/s<br>" + file.name);
            },
            afterAll: function() {
                fim.klausumatic.untagged.successMessageClosure(
                    "Upload finished:<br>" + 
                    currentUploadOK + " new files,<br>" +
                    currentUploadDuplicate + " duplicates ignored.")();
                resetStatus();
                fim.klausumatic.untagged.refresh();
                currentUploadOK = 0;
                currentUploadDuplicate = 0;
                $(speedSel).html("");
                $(progressSel).hide();
                $(uploadSel).fadeIn();
            }
        });
    }

    function errorMessageClosure(msg) {
        // TODO merge with the other message function
        return function() {
            var bubble = $('<div class="ebubble"><p class="head">ERROR</p>' + 
                msg + '</div>');
            bubble.hide();
            bubble.appendTo("body");
            bubble.fadeIn();

            function createFadeoutClosure(bubble) {
                return function() {
                    bubble.fadeOut();
                }
            }
            function createDeleteClosure(bubble) {
                return function() {
                    bubble.detach();
                }
            }
            window.setTimeout(createFadeoutClosure(bubble), 2000);
            window.setTimeout(createDeleteClosure(bubble), 3000);
        }
    }

    function setStatus(percent) {
        var text = "KLAUSUMATIC 3000",
            i;
        i = text.length * (percent/100);
        $("h1").html("<span>" + text.substr(0, i) + "</span>" + 
            text.substr(i, text.length - i + 1));
    }

    function resetStatus() {
        setStatus(0);
    }


}());

fim.namespace('fim.klausumatic.fn');
(function(){
    "use strict";

    fim.klausumatic.fn.parse = parse;

    var subjects = {
            'algodat'           :  'Algorithmen und Datenstrukturen',
            'pi1'               :  'Praktische Informatik I',
            'pi2'               :  'Praktische Informatik II',
            'pk1'               :  'Programmierkurs I',
            'pk2'               :  'Programmierkurs II',
            'swt'               :  'Softwaretechnik',
            'bs'                :  'Betriebssysteme',
            'ana'               :  'Analysis',
            'ana1'              :  'Analysis I',
            'ana2'              :  'Analysis II',
            'ewt'               :  'Einfuehrung in die Wahrscheinlichkeitstheorie',
            'hm1'               :  'Hoehere Mathematik I',
            'hm2'               :  'Hoehere Mathematik II',
            'la1'               :  'Lineare Algebra I',
            'la2'               :  'Lineare Algebra II',
            'num1'              :  'Numerik I',
            'stoch'             :  'Stochastik',
            'versmathe'         :  'Versicherungsmathematik',
            'wt'                :  'Wahrscheinlichkeitstheorie',
            'et'                :  'Elektrotechnik',
            'et2'               :  'Elektrotechnik II',
            'ra1'               :  'Rechnerarchitektur',
            'et1'               :  'Elektrotechnik 1',
            'erp'               :  'ERP Business Software',
            'tbr'               :  'Technik des Betriebswirtschaftlichen Rechnungswesens',
            'wifo1'             :  'Wirtschaftsinformatik I',
            'wifo2'             :  'Wirtschaftsinformatik II',
            'marketing'         :  'Marketing',
            'la2dma'            :  'Lineare Algebra II / Diskrete Mathematik A',
            'sad'               :  'Systemadministration',
            'pgti'              :  'Physikalische Grundlagen der Technischen Informatik',
            'dbl'               :  'Datenbanken und Logik',
            'ti'                :  'Theoretische Informatik',
            'rn'                :  'Rechnernetze',
            'vs'                :  'Verteilte Systeme',
            'mmt'               :  'Multimedia Technology',
            'is'                :  'Informationssysteme',
            'wr'                :  'Wissensrepraesentation',
            'swt1'              :  'Softwaretechnik 1',
            'db'                :  'Datenbanken',
            'swt2'              :   'Softwaretechnik 2',
            'ger'               :   'Grundlagen des externen Rechnungswesens',
            'dma'               :   'Diskrete Mathematik A',
            'dmb'               :   'Diskrete Mathematik B'},
        types = {
            'vd'                    :  'Vordiplom',
            'vordiplom'             :  'Vordiplom',
            'schein'                :  'Schein',
            'zwischenklausur'       :  'Zwischenklausur',
            'diplom'                :  'Diplom',
            'bachelor'              :  'Bachelor',
            'klausur'               :  'Klausur',
            'scheinklausur'         :  'Scheinklausur',
            'nachklausur'           :  'Nachklausur',
            'wiederholungsklausur'  :  'Wiederholungsklausur',
            'uebungsklausur'        :  'Uebungsklausur',
            'musterklausur'         :  'Musterklausur',
            'schlussklausur'        :  'Schlussklausur',
            'modulklausur'          :  'Modulklausur'
        },
        profs = {
            'mcb'           :  'Majster-Cederbaum',
            'prof'          :  'Unbekannt',
            'nuernberger': 'Nürnberger',
            'maenner': 'Männer',
            'boecherer': 'Böcherer',
            'goettlich': 'Göttlich',
            'maedche': 'Mädche'
        };

    function parse(filename) {
        var re = /([a-zA-Z0-9]+)_([a-zA-Z0-9]+)_([a-zA-Z0-9]+)_([a-zA-Z0-9]+)_?([a-zA-Z0-9]*)_?([a-zA-Z0-9]*)\.[a-zA-Z]+/,
            arr, prof, subj, type, sem, note, sol, tmp, year, hws;

        arr = re.exec(filename);
        if (typeof(arr) !== "undefined" && arr != null) {
            subj = getSubjectName(arr[1]);
            type = getTypeName(arr[2]);
            prof = getProfName(arr[3]);
            sem = arr[4];
            tmp = getSemester(sem);
            if (typeof(subj) === "undefined" || 
                typeof(type) === "undefined" ||
                typeof(prof) === "undefined" ||
                typeof(tmp) === "undefined" ||
                typeof(sem) === "undefined") {
                return;
            }
            year = tmp[0];
            hws = tmp[1];
            if (arr.length > 5) {
                console.log(arr);
                sol = arr[5];
                if (sol == "ml") {
                    sol = true;
                } else {
                    if (arr.length == 6) {
                        note = arr[5];
                    }
                }
            }
            if (arr.length > 6) {
                note = arr[6];
            } 
            return {
                "professor": prof,
                "subject": subj,
                "degree": type,
                "year": year,
                "hws": hws,
                "solution": sol,
                "note": note
            };
        }
    }

    function getSubjectName(key) {
        return subjects[key];
    }
    function getTypeName(key) {
        return types[key];
    }

    function getProfName(key) {
        if (typeof(profs[key]) === "undefined") {
            return key.substr(0, 1).toUpperCase() + key.substr(1);
        } else {
            return profs[key];
        }
    }

    function getSemester(str) {
        var re1 = /([0-9]+)([a-zA-Z]+)/,
            re2 = /([a-zA-Z]+)([0-9]+)/,
            arr, sem, year, hws;
        
        if (str.match(re1)) {
            arr = re1.exec(str);
            sem = arr[2];
            year = arr[1];
        } else {
            arr = re2.exec(str);
            if (typeof(arr) === "undefined" || arr === null) {
                return;
            }
            sem = arr[1];
            year = arr[2];
        }

        sem = sem.toLowerCase();
        if (sem == "ws" || sem == "hws") {
            hws = true;
        } else {
            if (sem == "ss" || sem == "fss") {
                hws = false;
            } else {
                return;
            }
        }
        if (year.length === 4) {
            if (year[0] != "1" && year[0] != "2") {
                year = year.substr(0, 2);
            }
        }
        if (year.length === 2) {
                if (Number(year) > 60) {
                    year = "19" + year;
                } else {
                    year = "20" + year;
                }
        }
        return [year, hws];
    }
}());
