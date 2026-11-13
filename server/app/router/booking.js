var express = require("express");
var router = express.Router();

var BookingController = require("../controller/booking");
var authController = require("../controller/auth");

// All booking routes require a valid token
router.get("/", authController.logtoken, authController.validateToken, BookingController.getList);
router.get("/:id", authController.validateToken, BookingController.getByID);

router.post("/", authController.validateToken, BookingController.createBooking);

router.put("/:id", authController.validateToken, BookingController.updateBooking);

router.delete("/:id", authController.validateToken, BookingController.deleteBooking);

module.exports = router;
