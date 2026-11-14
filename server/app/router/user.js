/**
 * Cat Booking System
 * Group Member: Yosuke Nakamura, Tolga Unal, Yuhan Su, GYUBIN MUN, Juan Rojas Calvimontes
 * This file set up routers for /api/users, with CRUD and authentication functions implemented.
 */


var express = require("express");
var router = express.Router();

var UsersController = require("../controller/user");
var authController = require("../controller/auth");

// Public routes (no token yet when signing up or signing in)
router.post("/signin", authController.signin);
router.post("/", UsersController.createUser);

// Protected routes (token required)
router.get("/", authController.logtoken, authController.validateToken, UsersController.getList);
router.get("/:id", authController.validateToken, UsersController.getByID);

router.put("/:id", authController.validateToken, UsersController.updateUser);

router.delete("/:id", authController.validateToken, UsersController.deleteUser);

module.exports = router;
