const mongoose = require("mongoose");

const orderHistorySchema = mongoose.Schema({
    orderHistorydata: String, // Optional, for additional data or comments
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user", // Reference the user who placed the order
    },
    date: {
        type: Date,
        default: Date.now, // Automatically set the order date
    },
    Food: String, // Optional, if storing specific food-related info
    bag: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "menu", // Reference menu items or actual bag items
        },
    ],
});

module.exports = mongoose.model("orderHistory", orderHistorySchema);
