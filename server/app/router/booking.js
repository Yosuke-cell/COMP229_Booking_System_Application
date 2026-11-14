/**
 * Cat Booking System
 * Group Member: Yosuke Nakamura, Tolga Unal, Yuhan Su, GYUBIN MUN, Juan Rojas Calvimontes
 * This file set up routers for /api/bookings, with CRUD and authentication functions implemented.
 */


var express = require("express");
var router = express.Router();

var BookingController = require("../controller/booking");
var authController = require("../controller/auth");

// Public route (no token): when each cat is busy.
// It must stay above "/:id", otherwise Express would treat "public" as an id.
router.get("/public", BookingController.getPublicAvailability);

// All other booking routes require a valid token
router.get("/", authController.logtoken, authController.validateToken, BookingController.getList);
router.get("/:id", authController.validateToken, BookingController.getByID);

router.post("/", authController.validateToken, BookingController.createBooking);

router.put("/:id", authController.validateToken, BookingController.updateBooking);

router.delete("/:id", authController.validateToken, BookingController.deleteBooking);

module.exports = router;
