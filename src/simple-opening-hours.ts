export default class SimpleOpeningHours {
	/**
	 * Creates the OpeningHours Object with OSM opening_hours string
	 */
	constructor(inp: string) {
		this.parse(inp);
	}

	/**
	 * returns the OpeningHours Object
	 */
	public getTable() {
		return typeof this.openingHours === "object" ? this.openingHours : {};
	}

	/**
	 * Returns if the OpeningHours match on given Date
	 */
	public isOpenOn(date: Date): boolean {
		if (typeof this.openingHours !== "object") {
			return this.openingHours
		}
		let testDay = date.getDay();
		let testTime = date.getHours() + ":" + date.getMinutes()
		let i = 0;
		let times: string[];
		for (let key in this.openingHours) {
			if (i == testDay) {
				times = this.openingHours[key];
			}
			i++;
		}
		let isOpen = false
		times.forEach((time) => {
			//TODO: times like 09:00+ are not supported here
			let timedata = time.split('-');
			if ((this.compareTime(testTime, timedata[0]) != -1)
				&& (this.compareTime(timedata[1], testTime) != -1)) {
				isOpen = true;
			}
		});
		return isOpen;
	}

	/**
	 * returns if the OpeningHours match now
	 */
	public isOpenNow(): boolean {
		return typeof this.openingHours === "object" ? this.isOpenOn(new Date()) : this.openingHours
	}

	/**
	 * Parses the input and creates openingHours Object
	 */
	private parse(input:string) {
		if (/24\s*?\/\s*?7/.test(input)) {
			this.openingHours = true;
			return
		} else if (/\s*off\s*/.test(input)) {
			this.openingHours = false
			return
		}
		this.init();
		input = input.trim().toLowerCase().replace(/\s*([-:,;])\s*/g, '$1')
		let parts = this.splitHard(input);
		parts.forEach(part => {
			this.parseHardPart(part)
		});
	}

	/**
	 * Split on ;
	 */
	private splitHard(inp: string): string[] {
		return inp.split(';');
	}

	private parseHardPart(part: string) {
		if (part == "24/7") {
			part = "mo-su 00:00-24:00";
		}
		let segments = part.split(/\ |\,/);

		let tempData = {}
		let days = []
		let times = []
		segments.forEach((segment) => {
			if (this.checkDay(segment)) {
				if (times.length == 0) {
					days = days.concat(this.parseDays(segment));
				}
				else {
					//append
					days.forEach((day) => {
						if (tempData[day]) {
							tempData[day] = tempData[day].concat(times)
						}
						else {
							tempData[day] = times
						}
					})
					days = this.parseDays(segment)
					times = [];
				}
			}
			if (this.checkTime(segment)) {
				if (segment == "off") {
					times = []
				}
				else {
					times.push(segment)
				}
			}
		})

		//commit last times to it days
		days.forEach((day) => {
			if (tempData[day]) {
				tempData[day] = tempData[day].concat(times)
			}
			else {
				tempData[day] = times
			}
		})

		//apply data to main obj
		for (let key in tempData) {
			this.openingHours[key] = tempData[key];
		}
	}

	private parseDays(part: string): string[] {
		let days = []
		let softparts = part.split(',');
		softparts.forEach((part) => {
			let rangecount = (part.match(/\-/g) || []).length;
			if (rangecount == 0) {
				days.push(part)
			}
			else {
				days = days.concat(this.calcDayRange(part))
			}
		})

		return days
	}

	private initOpeningHoursObj() {
		this.openingHours = {
			su: [],
			mo: [],
			tu: [],
			we: [],
			th: [],
			fr: [],
			sa: [],
			ph: []
		}
	}

	/**
	 * Calculates the days in range "mo-we" -> ["mo", "tu", "we"]
	 */
	private calcDayRange(range: string): string[] {
		let def = {
			su: 0,
			mo: 1,
			tu: 2,
			we: 3,
			th: 4,
			fr: 5,
			sa: 6
		}

		let rangeElements = range.split('-');

		let dayStart = def[rangeElements[0]]
		let dayEnd = def[rangeElements[1]]

		let numberRange = this.calcRange(dayStart, dayEnd, 6);
		let outRange: string[] = [];
		numberRange.forEach(n => {
			for (let key in def) {
				if (def[key] == n) {
					outRange.push(key)
				}
			}
		});
		return outRange;
	}

	/**
	 * Creates a range between two number.
	 * if the max value is 6 a range bewteen 6 and 2 is 6, 0, 1, 2
	 */
	private calcRange(min: number, max: number, maxval): number[] {
		if (min == max) {
			return [min]
		}
		let range = [min];
		let rangepoint = min
		while (rangepoint < ((min < max) ? max : maxval)) {
			rangepoint++
			range.push(rangepoint)
		}
		if (min > max) {
			//add from first in list to max value
			range = range.concat(this.calcRange(0, max, maxval))
		}

		return range;
	}

	/**
	 * Check if string is time range
	 */
	private checkTime(inp: string): boolean {
		//e.g. 09:00+
		if (inp.match(/[0-9]{1,2}:[0-9]{2}\+/)) {
			return true
		}
		//e.g. 08:00-12:00
		if (inp.match(/[0-9]{1,2}:[0-9]{2}\-[0-9]{1,2}:[0-9]{2}/)) {
			return true
		}
		//off
		if (inp.match(/off/)) {
			return true
		}
		return false
	}

	/**
	 * check if string is day or dayrange
	 */
	private checkDay(inp: string): boolean {
		let days = ["mo", "tu", "we", "th", "fr", "sa", "su", "ph"]
		if (inp.match(/\-/g)) {
			let rangelements = inp.split('-');
			if (days.indexOf(rangelements[0]) !== -1
				&& days.indexOf(rangelements[1]) !== -1) {
				return true
			}
		}
		else {
			if (days.indexOf(inp) !== -1) {
				return true
			}
		}
		return false
	}

	/**
	 * Compares to timestrings e.g. "18:00"
	 * if time1 > time2 -> 1
	 * if time1 < time2 -> -1
	 * if time1 == time2 -> 0
	 */
	private compareTime(time1: string, time2: string) {
		let date1 = new Date('2016-01-01 ' + time1);
		let date2 = new Date('2016-01-01 ' + time2);
		if (date1 > date2) {
			return 1
		}
		if (date1 < date2) {
			return -1
		}
		return 0
	}

	private openingHours: Object | boolean;
}