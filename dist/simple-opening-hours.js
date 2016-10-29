var SimpleOpeningHours = (function () {
    function SimpleOpeningHours(inp) {
        this.parse(inp);
    }
    SimpleOpeningHours.prototype.getTable = function () {
        return this.mainObj;
    };
    SimpleOpeningHours.prototype.isOpenOn = function (date) {
        var _this = this;
        var testday = date.getDay();
        var testtime = date.getHours() + ":" + date.getMinutes();
        console.log('Day: ', testday, ', Time: ' + testtime);
        var i = 0;
        var times;
        for (var key in this.mainObj) {
            if (i == testday) {
                times = this.mainObj[key];
            }
            i++;
        }
        var isOpen = false;
        times.forEach(function (time) {
            //TODO: times like 09:00+ are not supported here
            var timedata = time.split('-');
            if ((_this.compareTime(testtime, timedata[0]) != -1)
                && (_this.compareTime(timedata[1], testtime) != -1)) {
                isOpen = true;
            }
        });
        return isOpen;
    };
    SimpleOpeningHours.prototype.isOpenNow = function () {
        return this.isOpenOn(new Date());
    };
    SimpleOpeningHours.prototype.parse = function (inp) {
        var _this = this;
        this.initMainObj();
        inp = this.simplify(inp);
        var parts = this.splitHard(inp);
        parts.forEach(function (part) {
            _this.parseHardPart(part);
        });
        console.log(this.mainObj);
    };
    SimpleOpeningHours.prototype.simplify = function (input) {
        input = input.toLocaleLowerCase();
        input = input.trim();
        input = input.replace(/ +(?= )/g, ''); //replace double spaces
        input = input.replace(' -', '-');
        input = input.replace('- ', '-');
        input = input.replace(' :', ':');
        input = input.replace(': ', ':');
        input = input.replace(' ,', ',');
        input = input.replace(', ', ',');
        input = input.replace(' ;', ';');
        input = input.replace('; ', ';');
        return input;
    };
    /**
     * Split on ;
     */
    SimpleOpeningHours.prototype.splitHard = function (inp) {
        return inp.split(';');
    };
    SimpleOpeningHours.prototype.parseHardPart = function (part) {
        var _this = this;
        if (part == "24/7") {
            part = "Mo-Su 00:00-24:00; Ph 00:00-24:00";
        }
        var segments = part.split(/\ |\,/);
        var tempData = {};
        var days = [];
        var times = [];
        segments.forEach(function (segment) {
            if (_this.checkDay(segment)) {
                if (times.length == 0) {
                    days = days.concat(_this.parseDays(segment));
                }
                else {
                    //append
                    days.forEach(function (day) {
                        if (tempData[day]) {
                            tempData[day] = tempData[day].concat(times);
                        }
                        else {
                            tempData[day] = times;
                        }
                    });
                    days = _this.parseDays(segment);
                    times = [];
                }
            }
            if (_this.checkTime(segment)) {
                if (segment == "off") {
                    times = [];
                }
                else {
                    times.push(segment);
                }
            }
        });
        //commit last times to it days
        days.forEach(function (day) {
            if (tempData[day]) {
                tempData[day] = tempData[day].concat(times);
            }
            else {
                tempData[day] = times;
            }
        });
        //apply data to main obj
        for (var key in tempData) {
            this.mainObj[key] = tempData[key];
        }
    };
    SimpleOpeningHours.prototype.parseDays = function (part) {
        var _this = this;
        part = part.toLowerCase();
        var days = [];
        var softparts = part.split(',');
        softparts.forEach(function (part) {
            var rangecount = (part.match(/\-/g) || []).length;
            if (rangecount == 0) {
                days.push(part);
            }
            else {
                days = days.concat(_this.calcDayRange(part));
            }
        });
        return days;
    };
    SimpleOpeningHours.prototype.initMainObj = function () {
        this.mainObj = {
            su: [],
            mo: [],
            tu: [],
            we: [],
            th: [],
            fr: [],
            sa: [],
            ph: []
        };
    };
    /**
     * Calculates the days in range "mo-we" -> ["mo", "tu", "we"]
     */
    SimpleOpeningHours.prototype.calcDayRange = function (range) {
        var def = {
            su: 0,
            mo: 1,
            tu: 2,
            we: 3,
            th: 4,
            fr: 5,
            sa: 6
        };
        var rangeElements = range.split('-');
        var dayStart = def[rangeElements[0]];
        var dayEnd = def[rangeElements[1]];
        var numberRange = this.calcRange(dayStart, dayEnd, 6);
        var outRange = [];
        numberRange.forEach(function (n) {
            for (var key in def) {
                if (def[key] == n) {
                    outRange.push(key);
                }
            }
        });
        return outRange;
    };
    /**
     * Creates a range between two number.
     * if the max value is 6 a range bewteen 6 and 2 is 6, 0, 1, 2
     */
    SimpleOpeningHours.prototype.calcRange = function (min, max, maxval) {
        if (min == max) {
            return [min];
        }
        var range = [min];
        var rangepoint = min;
        while (rangepoint < ((min < max) ? max : maxval)) {
            rangepoint++;
            range.push(rangepoint);
        }
        if (min > max) {
            //add from first in list to max value
            range = range.concat(this.calcRange(0, max, maxval));
        }
        return range;
    };
    /**
     * Check if string is time range
     */
    SimpleOpeningHours.prototype.checkTime = function (inp) {
        //e.g. 09:00+
        if (inp.match(/[0-9]{1,2}:[0-9]{2}\+/)) {
            return true;
        }
        //e.g. 08:00-12:00
        if (inp.match(/[0-9]{1,2}:[0-9]{2}\-[0-9]{1,2}:[0-9]{2}/)) {
            return true;
        }
        //off
        if (inp.match(/off/)) {
            return true;
        }
        return false;
    };
    /**
     * check if string is day or dayrange
     */
    SimpleOpeningHours.prototype.checkDay = function (inp) {
        var days = ["mo", "tu", "we", "th", "fr", "sa", "su", "ph"];
        if (inp.match(/\-/g)) {
            var rangelements = inp.split('-');
            if (days.indexOf(rangelements[0]) !== -1
                && days.indexOf(rangelements[1]) !== -1) {
                return true;
            }
        }
        else {
            if (days.indexOf(inp) !== -1) {
                return true;
            }
        }
        return false;
    };
    /**
     * Compares to timestrings e.g. "18:00"
     * if time1 > time2 -> 1
     * if time1 < time2 -> -1
     * if time1 == time2 -> 0
     */
    SimpleOpeningHours.prototype.compareTime = function (time1, time2) {
        var date1 = new Date('2016-01-01 ' + time1);
        var date2 = new Date('2016-01-01 ' + time2);
        if (date1 > date2) {
            return 1;
        }
        if (date1 < date2) {
            return -1;
        }
        return 0;
    };
    return SimpleOpeningHours;
}());
/// <reference path='openingparser.ts' />
var OpeningParserTests = (function () {
    function OpeningParserTests() {
        /*let cl = new OpeningParser();
        
        let simplifytestcases: string[][];
        simplifytestcases = [
            ['Mo-Fr 8:00-12:00', 'Mo-Fr 8:00-12:00'],
            ['Mo -Fr 8:00-12:00', 'Mo-Fr 8:00-12:00'],
            ['Mo - Fr 8:00-12:00', 'Mo-Fr 8:00-12:00'],
            ['Mo-Fr 8:00- 12:00', 'Mo-Fr 8:00-12:00'],
            ['Mo-Fr 8:00 -12:00', 'Mo-Fr 8:00-12:00'],
            ['Mo-Fr 8:00 - 12:00', 'Mo-Fr 8:00-12:00'],
            ['Mo-Fr 8:00-12:00 ', 'Mo-Fr 8:00-12:00'],
            ['Mo-Fr  8:00-12:00', 'Mo-Fr 8:00-12:00'],
            ['Mo-Fr 8:00-12 :00', 'Mo-Fr 8:00-12:00'],
            ['Mo-Fr 8:00-12 : 00', 'Mo-Fr 8:00-12:00'],
            ['Mo-Fr 8:00-12: 00', 'Mo-Fr 8:00-12:00'],

            ['Mo-Fr 8:00-12:00, 14:00-18:00', 'Mo-Fr 8:00-12:00,14:00-18:00'],
            ['Mo-Fr 8:00-12:00,14:00-18:00', 'Mo-Fr 8:00-12:00,14:00-18:00'],
            ['Mo-Fr 8:00-12:00 , 14:00-18:00', 'Mo-Fr 8:00-12:00,14:00-18:00'],
            ['Mo-Fr 8:00-12:00 ,14:00-18:00', 'Mo-Fr 8:00-12:00,14:00-18:00'],

            ['Mo-Fr 8:00-12:00; Sa 14:00-18:00', 'Mo-Fr 8:00-12:00;Sa 14:00-18:00'],
            ['Mo-Fr 8:00-12:00;Sa 14:00-18:00', 'Mo-Fr 8:00-12:00;Sa 14:00-18:00'],
            ['Mo-Fr 8:00-12:00 ;Sa 14:00-18:00', 'Mo-Fr 8:00-12:00;Sa 14:00-18:00'],
            ['Mo-Fr 8:00-12:00 ; Sa 14:00-18:00', 'Mo-Fr 8:00-12:00;Sa 14:00-18:00'],
        ]
        this.testList(cl.simplify, simplifytestcases);

        let hardsplitList = [
            ['Mo-Fr 8:00-12:00;Sa 14:00-18:00', ["Mo-Fr 8:00-12:00", "Sa 14:00-18:00"]]
        ]
        this.testList(cl.splitHard, hardsplitList)

        console.log(cl.calcRange(1, 3, 6));
        console.log(cl.calcRange(5, 1, 6));

        console.log(cl.calcDayRange("mo-fr"));
        console.log(cl.calcDayRange("fr-mo"));

        //cl.parse('Mo-Fr 8:00-12:00; Sa 14:00-18:00');
        cl.parse('Mo-Fr 8:00-12:00, 14:00-18:00, Tu 19:00-21:00; Sa 14:00-18:00; We off');
        //cl.parse('Mo-Fr 8:00-12:00, Mi 14:00-18:00; Sa 14:00-18:00');*/
        console.log('OPEN NOW?', new SimpleOpeningHours('Mo-Sa 06:00-22:00').isOpenNow());
    }
    OpeningParserTests.prototype.testVal = function (func, inp, out) {
        var res = func(inp);
        //string
        if (typeof out == "string") {
            this.testString(res, inp, out);
        }
        //array
        if (!!out && Array === out.constructor) {
            this.testArr(res, inp, out);
        }
    };
    OpeningParserTests.prototype.testList = function (func, list) {
        var _this = this;
        list.forEach(function (testcase) {
            _this.testVal(func, testcase[0], testcase[1]);
        });
    };
    OpeningParserTests.prototype.testErr = function (inp, out) {
        console.log('\033[31mFAILED\x1B[0m: ' + inp + " == " + out);
    };
    OpeningParserTests.prototype.testSucc = function (inp, out) {
        console.log('\x1b[32m✓\x1B[0m ' + inp + ' == ' + out);
    };
    OpeningParserTests.prototype.testString = function (res, inp, out) {
        if (res == out) {
            this.testSucc(inp, out);
        }
        else {
            this.testErr(inp, out);
        }
    };
    OpeningParserTests.prototype.testArr = function (res, inp, out) {
        if (res.length != out.length) {
            this.testErr(inp, out);
        }
        for (var i = 0; i < res.length; i++) {
            if (res[i] != out[i]) {
                this.testErr(inp, out);
                break;
            }
        }
        this.testSucc(inp, out);
    };
    return OpeningParserTests;
}());
new OpeningParserTests();
//# sourceMappingURL=simple-opening-hours.js.map