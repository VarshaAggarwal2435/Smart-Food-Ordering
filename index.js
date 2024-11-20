const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userModel = require("./models/userModel");
const orderHistoryModel = require("./models/orderHistory");
const bagModel = require("./models/bagModel");
const menuModel = require("./models/menuModel");
// const multerconfig = require("./config/multerconfig");
const db = require("./config/mongooseConnection");

const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');


app.get("/signup", function(req, res){
    res.render("signup");
});

app.post("/create", async function(req, res){
    let {email, password} = req.body;
    const emailValid = email.trim();
    const passwordValid = password.trim();
    if(!emailValid || !passwordValid) 
        return res.send("Something went wrong")

    let user = await userModel.findOne({email});
    if(user)    
        return res.status(500).send("User Already exists");
    
    bcrypt.genSalt(10, (err, salt)=>{
        bcrypt.hash(password, salt, async (err, hash)=>{
            let createdUser = await userModel.create({
                email,
                password:hash
            });
            
            let token = jwt.sign({email}, "secret");
            res.cookie("token", token);
            res.send("Account Registered. You can login");
        })
    })
});

app.get("/orders", isLoggedIn, async function(req, res){
    let user = await userModel.findOne({email:req.user.email});
    if(!user)
        res.send("You are not logged in")
    res.render("orders", {user});
})

app.get("/orderHistory/create", async function(req, res) {
    let orderHistory = await orderHistoryModel.create({
        orderHistoryData:"Samosa",
        user:"670ab1042ceeb6351ed8bc9e"
    })

    let user = await userModel.findOne({_id:"670ab1042ceeb6351ed8bc9e"});
    user.orderHistory.push(orderHistory._id);
    await user.save();
    res.send(orderHistory);
})

app.get("/", function(req, res){
    res.render("index");
})

app.get("/logout", function(req, res){
    res.cookie("token", "");
    res.redirect("/");
});

app.get("/home", isLoggedIn, async function(req, res){
    let user = await userModel.findOne({email:req.user.email});
    if(!user)
        res.send("You are not logged in")
    res.render("home", {user});
});

app.get("/menu", isLoggedIn, async function(req, res){
    let user = await userModel.findOne({ email: req.user.email }).populate({
        path: 'bag',
        populate: {
            path: 'name',
            model: 'menu'
        }
    });

    if(!user)
        res.send("You are not logged in");
    let menu = await menuModel.find();
    res.render("menu", {user, menu});
});

app.get("/bag", isLoggedIn, async function(req, res){

    // let user = await userModel.findOne({email:req.user.email});
    const user = await userModel.findOne({ email:req.user.email }).populate({
        path: 'bag',
        populate: {
            path: 'name', // Populate 'name' field in each Bag item, which refers to a menu item
            model: 'menu' // Ensure the model for 'name' is Menu
        }
    });

    if(!user)
        res.send("You are not logged in");
    
    res.render("bag", {user, bagItems:user.bag});
});

app.post("/bag/increase/:id", isLoggedIn, async (req, res) => {
    try {
        const bagItem = await bagModel.findById(req.params.id);

        bagItem.quantity += 1; // Increment quantity
        await bagItem.save();
        return res.redirect("/bag");
    } catch (error) {
        res.status(500).send({ success: false, message: "Error incrementing quantity" });
    }
});

app.post("/bag/decrease/:id", isLoggedIn, async (req, res) => {
    try {
        const bagItem = await bagModel.findById(req.params.id);

        if (bagItem.quantity > 1) {
            bagItem.quantity -= 1; // Decrement quantity
            await bagItem.save();
        } else {
            // Optionally remove the item if quantity reaches 0
            await bagModel.findByIdAndDelete(req.params.id);
        }

        return res.redirect("/bag");
    } catch (error) {
        console.error("Error decrementing quantity:", error);
        res.status(500).send({ success: false, message: "Error decrementing quantity" });
    }
});


app.get("/payment", async function(req, res){
    res.render("payment");
});

app.get("/profile", isLoggedIn, async function(req, res){
    // let user = await userModel.findOne({email:req.user.email}).populate("bag");
    res.render("profile");
});

// app.post("/upload", isLoggedIn, upload.single("pic"), function(req, res){
//     res.redirect("/menu");
// })


app.post("/addToBag/:id", isLoggedIn, async function(req, res) {
    try {
        // Fetch the logged-in user and populate their bag
        const user = await userModel.findOne({ email: req.user.email }).populate({
            path: 'bag',
            populate: {
                path: 'name',
                model: 'menu'
            }
        });

        if (!user) {
            console.error("User not found");
            return res.status(404).send("User not found");
        }

        // Fetch the menu item by ID from params
        const menuItem = await menuModel.findById(req.params.id);

        // Check if the bag item already exists in the user's bag
        let bagItem = await bagModel.findOne({ name: menuItem._id });
        
        if (bagItem && user.bag.some(item => item.equals(bagItem._id))) {
            // If item exists in the user's bag, remove it

            // Filter out the item from the user's bag array
            // user.bag = user.bag.filter(item => !item.equals(bagItem._id));
            // Save the updated user document
            // await user.save();

            // Optionally remove the bag item from the Bag collection
            await bagModel.findByIdAndDelete(bagItem._id);

        } else {
            // If item doesn't exist in user's bag, add it

            bagItem = await bagModel.findOneAndUpdate(
                { name: menuItem._id },
                { $set: { name: menuItem._id, quantity: 1 } },
                { new: true, upsert: true } // Upsert to create if it doesn't exist
            );

            user.bag.push(bagItem._id); // Add the new bag item
            await user.save();
        }

        return res.redirect("/menu");

    } catch (error) {
        // Log detailed error for debugging
        console.error("Error during add/remove from bag:", error);
        res.status(500).send("Error updating bag");
    }
});



app.post("/", async function(req, res){
    let user = await userModel.findOne({email:req.body.email});
    if(user)
        bcrypt.compare(req.body.password, user.password, function(err, result){
            if(result){
                let token = jwt.sign({email: user.email}, "secret");
                res.cookie("token", token);
                res.redirect("/home");
            }  
            else   
                res.send("Retry");     
        })
    else
        return res.send("Something went wrong");
});

function isLoggedIn(req, res, next){
    if(req.cookies.token === "")
        res.redirect("/");
    else{
        let data = jwt.verify(req.cookies.token, "secret");
        req.user = data;
        next();
    }
}

app.listen(3000, function(){
    console.log("Smart Order starting");
});
