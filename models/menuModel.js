const mongoose = require("mongoose");

const menuSchema = mongoose.Schema({
    name:String,
    price:Number,
});

module.exports = mongoose.model("menu", menuSchema);
