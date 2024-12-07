const mongoose = require("mongoose");

const giftSchema = mongoose.Schema({
    name:
    {
        type:mongoose.Schema.Types.ObjectId,
        ref:"menu",
    },
    quantity:{
        type:Number
    }
});

module.exports = mongoose.model("gift", giftSchema);
