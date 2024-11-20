const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
    email:String, 
    password: String,
    phoneNo:Number,
    profilePic:{
        type:String,
        default:"logoImage.jpg"
    },
    orderHistory:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"orderHistory"
        }
    ],
    bag:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"bag",
        },
    ],
});

module.exports = mongoose.model("user", userSchema);
