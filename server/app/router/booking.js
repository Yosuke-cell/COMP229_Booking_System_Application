var express = require("express");
var router = express.Router();

var BookingController = require("../controller/booking");

router.get("/", BookingController.getList);
router.get("/:id", BookingController.getByID);

router.post("/", BookingController.createBooking);

router.put("/:id", BookingController.updateBooking);

router.delete("/:id", BookingController.deleteBooking);

module.exports = router;
