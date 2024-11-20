const mongoose = require("mongoose");

const orderHistorySchema = mongoose.Schema({
    orderHistorydata:String,
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user"
    },
    date:{
        type:Date,
        default:Date.now
    },
    Food:String,
    bag:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"user"
        }
    ]
});

module.exports = mongoose.model("orderHistory", orderHistorySchema);

