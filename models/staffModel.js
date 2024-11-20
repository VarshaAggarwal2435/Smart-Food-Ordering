const mongoose = require("mongoose");

const staffSchema = mongoose.Schema({
    email:String, 
    password: String,
    phoneNo:Number,
    profilePic:{
        type:String,
        default:"logoImage.jpg"
    }
});

module.exports = mongoose.model("staff", staffSchema);

