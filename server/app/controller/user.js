let UsersModel = require("../model/user");

// Returns true if the logged-in user is the owner of this account or an admin
function canAccess(req, userId) {
  return req.auth.id === userId || req.auth.admin;
}

//get all of users (admin only)
module.exports.getList = async function (req, res, next) {
  try {
    if (!req.auth.admin) {
      return res.status(403).json({
        success: false,
        message: "Admins only.",
      });
    }

    let list = await UsersModel.find({});

    res.json({
      success: true,
      message: "Users list retrieved successfully.",
      data: list,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

//get user by ID (owner or admin)
module.exports.getByID = async function (req, res, next) {
  try {
    let userId = req.params.id;

    if (!canAccess(req, userId)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to access this user.",
      });
    }

    let user = await UsersModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    res.json({
      success: true,
      message: "User retrieved successfully.",
      data: user,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

//create new users (sign up - public)
module.exports.createUser = async function (req, res, next) {
  try {
    // nobody can make themselves admin when signing up
    delete req.body.admin;
    let newUser = UsersModel(req.body);

    let result = await UsersModel.create(newUser);
    console.log(result);

    res.json({
      success: true,
      message: "User added successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

//update users (owner or admin)
module.exports.updateUser = async function (req, res, next) {
  try {
    let userId = req.params.id;

    if (!canAccess(req, userId)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to edit this user.",
      });
    }

    let user = await UsersModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (req.body.firstName) user.firstName = req.body.firstName;
    if (req.body.lastName) user.lastName = req.body.lastName;
    if (req.body.email) user.email = req.body.email;
    if (req.body.password) user.password = req.body.password;
    user.updated = Date.now();

    let result = await user.save();
    res.json({
      success: true,
      message: "User updated successfully.",
      data: result,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

//delete users (owner or admin)
module.exports.deleteUser = async function (req, res, next) {
  try {
    let userId = req.params.id;

    if (!canAccess(req, userId)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to delete this user.",
      });
    }

    let result = await UsersModel.deleteOne({ _id: userId });
    console.log(result);

    if (result.deletedCount > 0) {
      res.json({
        success: true,
        message: "User deleted successfully.",
        data: result,
      });
    } else {
      res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};
