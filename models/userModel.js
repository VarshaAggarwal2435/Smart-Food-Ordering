const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
    email: String,
    password: String,
    image:{
        type:String,
        default:"logoimage.jpg"
    },
    name:{
        type:String,
        default:"Student",
    },
    phoneNo: Number,
    balance: {
        type:Number,
        default:0,
    },
    totalSpend:{
        type:Number,
        default:0,
    },
    giftTotal: {
        type:Number,
        default:0,
    },
    profilePic: {
        type: String,
        default: "logoImage.jpg",
    },
    orderHistory: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "orderHistory",
        },
    ],
    bag: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "bag",
        },
    ],
    gift: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "gift",
        },
    ],
    availableGifts: [
        {
            giftItem: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "gift",
                },
            ],
        },
    ],
    receivedGifts: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "receivedGift",
        },
    ],
});

module.exports = mongoose.model("user", userSchema);
