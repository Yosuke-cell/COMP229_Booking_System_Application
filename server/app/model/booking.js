/**
 * Cat Booking System
 * Group Member: Yosuke Nakamura, Tolga Unal, Yuhan Su, GYUBIN MUN, Juan Rojas Calvimontes
 * This file set up a mongoose schema that determines the fields for database storage related to /api/bookings.
 */



let mongoose = require("mongoose");

let BookingModel = mongoose.Schema(
  {
    title: {
      type: String,
      required: "Title is required.",
    },
    description: String,
    catName: {
      type: String,
      required: "Cat name is required.",
    },
    startDate: {
      type: Date,
      required: "Start date is required.",
    },
    endDate: {
      type: Date,
      required: "End date is required.",
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: "Owner is required.",
    },
    created: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
    updated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: "bookings",
  },
);

// Ensure virtual fields are serialised.
BookingModel.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
  },
});

module.exports = mongoose.model("Booking", BookingModel);