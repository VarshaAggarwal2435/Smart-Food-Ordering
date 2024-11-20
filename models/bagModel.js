const mongoose = require("mongoose");

const bagSchema = mongoose.Schema({
    name:
    {
        type:mongoose.Schema.Types.ObjectId,
        ref:"menu",
    },
    quantity:{
        type:Number
    }
});

module.exports = mongoose.model("bag", bagSchema);
