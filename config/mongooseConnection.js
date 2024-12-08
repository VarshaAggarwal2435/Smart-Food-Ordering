const mongoose = require("mongoose");

mongoose
.connect("mongodb+srv://va2435160:qHFbnJflzrOcoCfG@smartfoodorder.7z9sm.mongodb.net/Students")
.then(function(){
    console.log("Connected");
})
.catch(function(err){
    console.log(err)
})

module.exports = mongoose.connection;