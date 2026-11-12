let UsersModel = require("../model/user");

//get all of users
module.exports.getList = async function (req, res, next) {
  try {
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

//get user by ID
module.exports.getByID = async function (req, res, next) {
  try {
    let userId = req.params.id;
    let user = await UsersModel.findById(userId);

    if(!user){
        return res.status(404).json({
            success: false,
            message: "User not found"
        })
    }
    res.json({
      success: true,
      message: "Users retrieved successfully.",
      data: user,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

//create new users
module.exports.createUser = async function (req, res, next) {
  try {
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

//update users
module.exports.updateUser = async function (req, res, next) {
  try {
    let userId = req.params.id;

    let user = await UsersModel.findById({ _id: userId });
    if(!user){
        return res.status(404).json({
            success: false,
            message: "User not found"
        })
    }

    if (req.body.firstName) user.firstName = req.body.firstName;
    if (req.body.lastName) user.lastName = req.body.lastName;
    if (req.body.email) user.email = req.body.email;
    if (req.body.password) user.password = req.body.password;
    user.updated = Date.now();

    let result = await user.save();
    res.json({
      success: true,
      message: "Users updated successfully.",
      data: result
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

//delete users
module.exports.deleteUser = async function (req, res, next) {
  try {
    let userId = req.params.id;
    let result = await UsersModel.deleteOne({ _id: userId });
    console.log(result);

    if (result.deletedCount > 0) {
      res.json({
        success: true,
        message: "Users deleted successfully.",
        data: result,
      });
    } else {
      res.json({
        success: false,
        message: "Users deleted. Are you sure it exsits?",
      });
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};
