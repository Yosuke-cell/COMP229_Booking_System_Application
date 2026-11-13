const express = require("express");
var createError = require("http-errors");
var logger = require("morgan");
var cors = require("cors");

//Import routers
var BookingRouter = require("../app/router/booking");
var UserRouter = require("../app/router/user");

//config express
const app = express();
app.use(cors());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Home route (so the live URL shows the API is running)
app.get("/", (req, res) => {
  res.json({ success: true, message: "Booking System API is running." });
});

// Routers
app.use("/api/bookings", BookingRouter);
app.use("/api/users", UserRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // invalid MongoDB ID (e.g. "abc") is the user's mistake -> 400, not 500
  if (err.name === "CastError") {
    err.status = 400;
    err.message = "Invalid ID format.";
  }

  // render the error json
  res.status(err.status || 500);
  res.json({
    success: false,
    message: err.message,
  });
});

module.exports = app;
