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