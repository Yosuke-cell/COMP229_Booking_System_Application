/**
 * Cat Booking System
 * Group Member: Yosuke Nakamura, Tolga Unal, Yuhan Su, GYUBIN MUN, Juan Rojas Calvimontes
 * This file serves as a function to connect to MongoDB, provided by the connection strings in the .env file.
 */


let mongoose = require('mongoose');
require('dotenv').config()

module.exports = async function(){
  try {
    await mongoose.connect(process.env.ATLASDB);
    console.log("You successfully connected to MongoDB!");
    return mongoose;
    } catch (err) {
      console.dir(err);
    }
}