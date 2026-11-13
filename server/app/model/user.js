let mongoose = require("mongoose");
let Schema = mongoose.Schema;
let crypto = require('crypto');

let UserSchema = new Schema(
  {
    firstName: String,
  lastName: String,
  email: {
    type: String,
    unique: true,
    required: 'Email is required',
    trim: true,
    match: [/.+\@.+\..+/, "Please fill a valid e-mail address"]
  },
  hashed_password: {
    type: String,
    required: 'Passoword is required',
  },
  salt: {
    type: String
  },
  created: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  updated: {
    type: Date,
    default: Date.now
  },
  admin: {
    type: Boolean,
    default: false
  }
  },
  {
    collection: "Users",
  },
);

UserSchema.virtual('fullName')
  .get(function () {
    return this.firstName + ' ' + this.lastName;
  })
  .set(function (fullName) {
    let splitName = fullName.split(' ');
    this.firstName = splitName[0] || '';
    this.lastName = splitName[1] || '';
  });


UserSchema.virtual('password')
  .set(function (password) {
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters.')
    }
    else {
      this.salt = Buffer.from(crypto.randomBytes(16).toString('base64'), 'base64');
      this.hashed_password = this.hashPassword(password);
    }
  });

UserSchema.methods.hashPassword = function (password) {
  return crypto.pbkdf2Sync(password, this.salt, 10000, 64, 'sha512').toString('base64');
}

UserSchema.methods.authenticate = function (password) {
  return this.hashed_password === this.hashPassword(password);
}

// Ensure virtual fields are serialised.
UserSchema.set('toJSON', {
  virtuals: true,
  versionKey:false,
  transform: function (doc, ret) { 
    delete ret._id;
    delete ret.hashed_password;
    delete ret.salt;
  }
});

module.exports = mongoose.model('User', UserSchema);