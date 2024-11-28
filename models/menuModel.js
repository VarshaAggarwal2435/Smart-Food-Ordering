const mongoose = require("mongoose");

const menuSchema = mongoose.Schema({
    name:String,
    price:Number,
    image: {
        type: String, // Stores the file path or URL
        required: true, // Ensure every item has an image
    },
});

module.exports = mongoose.model("menu", menuSchema);
