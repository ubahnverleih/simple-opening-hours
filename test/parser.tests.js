const t = require("tap")

const oh = require("../dist/simple-opening-hours").default

t.ok((new oh("24/7")).isOpenNow())
t.ok((new oh(" 24/7")).isOpenNow())
t.ok((new oh(" 24/7 ")).isOpenNow())
t.ok((new oh("24/7 ")).isOpenNow())
t.ok((new oh("24 / 7")).isOpenNow())
t.ok((new oh("24/7")).getTable())

t.notOk((new oh("off")).isOpenNow())
t.notOk((new oh(" off")).isOpenNow())
t.notOk((new oh("off ")).isOpenNow())
t.notOk((new oh(" off ")).isOpenNow())

t.ok((new oh("Mo-Sa 06:00-22:00")).isOpenOn(new Date('2016-10-01 18:00')))
t.notOk((new oh("Mo 06:00-22:00")).isOpenOn(new Date('2016-10-01 18:00')))
t.ok((new oh("Mo-Sa 09:00+")).isOpenOn(new Date('2016-10-01 18:00')))
t.notOk((new oh("Mo-Sa off")).isOpenOn(new Date('2016-10-01 18:00')))
t.notOk((new oh("Mo-Sa 06:00-22:00")).isOpenOn(new Date('2016-10-01 05:00')))
t.ok((new oh("Mo-Sa 06:00-22:00")).getTable())