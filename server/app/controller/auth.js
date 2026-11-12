let User = require('../model/user');
let jwt = require('jsonwebtoken');
let { expressjwt } = require('express-jwt');
require('dotenv').config();

let privatekey = process.env.SECRETKEY;

///jwt.io

module.exports.signin = async function (req, res, next) {
  try {
    let user = await User.findOne({ email: req.body.email });
    if (!user || !user.authenticate(req.body.password)) {
      return res.status(401).json({ success: false, message: "Email or password is incorrect." });
    }

    let payload = { id: user._id, email: user.email, admin: user.admin };
    let token = jwt.sign(payload, privatekey, { algorithm: 'HS512', expiresIn: '1d' });

    res.json({ success: true, message: "User authenticated successfully.", token: token });
  } catch (error) {
    console.log(error);
    next(error);
  }
};


// Prints the Authorization header to the terminal (for debugging)
module.exports.logtoken = function (req, res, next) {
  console.log(req.headers.authorization);
  next();
};

// Checks the token. If it is missing or invalid, responds with 401.
// If it is valid, the decoded token is saved in req.auth
module.exports.validateToken = expressjwt({
  secret: privatekey,
  algorithms: ['HS512'],
  requestProperty: 'auth'
});
