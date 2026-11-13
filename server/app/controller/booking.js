let BookingModel = require("../model/booking");

//filter for avoiding duplication booking
async function findConflict(catName, startDate, endDate, excludeId) {
  let filter = {
    catName: catName,
    status: { $ne: "cancelled" },
    startDate: { $lt: endDate },
    endDate: { $gt: startDate },
  };
  if (excludeId) {
    filter._id = { $ne: excludeId };
  }
  return await BookingModel.findOne(filter);
}
//get all list of bookings
module.exports.getList = async function (req, res, next) {
  try {
    let filter = req.auth.admin ? {} : { user: req.auth.id };
    let list = await BookingModel.find(filter);

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

//public availability (no token needed)
//shows when each cat is busy, but never who booked it
module.exports.getPublicAvailability = async function (req, res, next) {
  try {
    //only bookings that are still active and not over yet
    let filter = {
      status: { $ne: "cancelled" },
      endDate: { $gt: new Date() },
    };

    //optional: /api/bookings/public?catName=Mochi
    if (typeof req.query.catName === "string" && req.query.catName.trim() !== "") {
      filter.catName = req.query.catName.trim();
    }

    //return only these four fields, so no user data leaves the server
    let list = await BookingModel.find(filter)
      .select({ catName: 1, startDate: 1, endDate: 1, status: 1, _id: 0 })
      .sort({ startDate: 1 })
      .lean();

    res.json({
      success: true,
      message: "Public availability retrieved successfully.",
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
    //check if owner is correct
    if (Booking.user.toString() !== req.auth.id && !req.auth.admin) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to view this booking.",
      });
    }
    res.json({
      success: true,
      message: "Booking retrieved successfully.",
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
    // only admin can set status (users get the default "pending")
    if (!req.auth.admin) {
      delete req.body.status;
    }

    //check if the end date is after the start date
    let start = new Date(req.body.startDate);
    let end = new Date(req.body.endDate);

    // dates must be sent and must be valid
    if (isNaN(start) || isNaN(end)) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required and must be valid dates.",
      });
    }

    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: "End date must be after start date.",
      });
    }

    //double booking check
    let conflict = await findConflict(req.body.catName, start, end);
    if (conflict) {
      return res.status(409).json({
        success: false,
        message: "This cat is already booked for that time.",
      });
    }

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

    if(!req.auth.admin){
      delete req.body.status;
    }

    //user may send only one date.
    // || is if left one is empty, use right one
    let start = new Date(req.body.startDate || booking.startDate);
    let end = new Date(req.body.endDate || booking.endDate);
    let catName = req.body.catName || booking.catName;

    if(isNaN(start) || isNaN(end)){
      return res.status(400).json({
        success: false,
        message: "Start date and end date must be valid dates."
      })
    }

    if(end <= start){
      return res.status(400).json({
        success: false,
        message: "End date must be after start date."
      })
    }

    let conflict = await findConflict(catName, start, end, BookingId);
    if(conflict){
      return res.status(409).json({
        success: false,
        message: "This cat is already booked for that time."
      })
    }
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
