var SimpleOpeningHours = (function () {
    /**
     * Creates the OpeningHours Object with OSM opening_hours string
     */
    function SimpleOpeningHours(inp) {
        this.parse(inp);
    }
    /**
     * returns the OpeningHours Object
     */
    SimpleOpeningHours.prototype.getTable = function () {
        return this.openingHours;
    };
    /**
     * Returns if the OpeningHours match on given Date
     */
    SimpleOpeningHours.prototype.isOpenOn = function (date) {
        var _this = this;
        var testday = date.getDay();
        var testtime = date.getHours() + ":" + date.getMinutes();
        var i = 0;
        var times;
        for (var key in this.openingHours) {
            if (i == testday) {
                times = this.openingHours[key];
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
    /**
     * returns if the OpeningHours match now
     */
    SimpleOpeningHours.prototype.isOpenNow = function () {
        return this.isOpenOn(new Date());
    };
    /**
     * Parses the input and creates openingHours Object
     */
    SimpleOpeningHours.prototype.parse = function (inp) {
        var _this = this;
        this.initOpeningHoursObj();
        inp = this.simplify(inp);
        var parts = this.splitHard(inp);
        parts.forEach(function (part) {
            _this.parseHardPart(part);
        });
    };
    SimpleOpeningHours.prototype.simplify = function (input) {
        if (input == "24/7") {
            input = "mo-su 00:00-24:00; ph 00:00-24:00";
        }
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
            part = "mo-su 00:00-24:00";
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
            this.openingHours[key] = tempData[key];
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
    SimpleOpeningHours.prototype.initOpeningHoursObj = function () {
        this.openingHours = {
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
//# sourceMappingURL=simple-opening-hours.js.map