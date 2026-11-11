const express = require("express");
var createError = require("http-errors");
var logger = require("morgan");
var cors = require("cors");

//Import routers


//config express
const app = express();
app.use(cors());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routers


// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // render the error json
  res.status(err.status || 500);
  res.json({
    success: false,
    message: err.message,
  });
});

module.exports = app;
