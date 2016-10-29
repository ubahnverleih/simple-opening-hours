# SimpleOpeningHours()

SimpleOpeningHours is a small JavaScript class to parse OpenStreetMap `opening_hours`
It only supports the human readable parts and not [this complete crazy overengineered specification](https://wiki.openstreetmap.org/wiki/Key:opening_hours/specification).

## Supported opening_hours examples

* `Mo-Sa 06:00-22:00`
* `Mo-Fr 08:00-18:00; Sa 10:00-14:00`
* `Mo-Fr 08:00-18:00; Sa,Su 10:00-20:00`
* `Mo-Fr 08:00-12:00, We 14:00-18:00`
* `Mo-Fr 08:00-12:00, 14:00-18:00`
* `Mo-Fr 08:00-18:00; We off`
* `24/7`

## Usage
	var opening = new SimpleOpeningHours('Mo-Sa 06:00-22:00');
	console.log('Is this open now?', opening.isOpenNow());
	console.log('Is this open on 2016-10-01 18:00?', opening.isOpenOn(new Date('2016-10-01 18:00')));
	console.table(opening.getTable());