let BookingModel = require("../model/booking");

//get all list of bookings
module.exports.getList = async function (req, res, next) {
  try {
    let list = await BookingModel.find({});

    res.json({
      success: true,
      message: "Bookings list retrieved successfully.",
      data: list,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

//get booking by ID
module.exports.getByID = async function (req, res, next) {
  try {
    let BookingId = req.params.id;
    let Booking = await BookingModel.findOne({ _id: BookingId });

    if (!Booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }
    res.json({
      success: true,
      message: "Bookings list retrieved successfully.",
      data: Booking,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

//create booking
module.exports.createBooking = async function (req, res, next) {
  try {
    req.body.user = req.auth.id;
    let newBooking = BookingModel(req.body);

    let result = await BookingModel.create(newBooking);
    console.log(result);

    res.json({
      success: true,
      message: "Booking added successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

//update booking
module.exports.updateBooking = async function (req, res, next) {
  try {
    let BookingId = req.params.id;

    // find the booking first, so we can check who owns it
    let booking = await BookingModel.findById(BookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }
    if (booking.user.toString() !== req.auth.id && !req.auth.admin) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to edit this booking.",
      });
    }
    delete req.body.user;

    let result = await BookingModel.findByIdAndUpdate(
      BookingId,
      { ...req.body, updated: Date.now() },
      { new: true, runValidators: true },
    );
    console.log(result);

    res.json({
      success: true,
      message: "Bookings updated successfully.",
      data: result,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

//delete booking
module.exports.deleteBooking = async function (req, res, next) {
  try {
    let bookingId = req.params.id;

    // find the booking first, so we can check who owns it
    let booking = await BookingModel.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }
    if (booking.user.toString() !== req.auth.id && !req.auth.admin) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to cancel this booking.",
      });
    }

    // only cancel AFTER the checks pass
    let result = await BookingModel.findByIdAndUpdate(
      bookingId,
      { status: "cancelled", updated: Date.now() },
      { new: true },
    );
    console.log(result);

    res.json({
      success: true,
      message: "Booking cancelled successfully.",
      data: result,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};
