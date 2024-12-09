const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userModel = require("./models/userModel");
const orderHistoryModel = require("./models/orderHistory");
const bagModel = require("./models/bagModel");
const giftModel = require("./models/giftModel");
const menuModel = require("./models/menuModel");
// const multerconfig = require("./config/multerconfig");
const db = require("./config/mongooseConnection");
const PORT = process.env.PORT || 3000;
const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
const fs = require('fs');
const { table } = require("console");

let tableNumber = null;

// Middleware to check admin access
// function isAdmin(req, res, next) {
//     if (req.user?.isAdmin) {
//         return next();
//     }
//     return res.status(403).send('<h1>Access Denied</h1>');
// }

// Admin route to view orders in JSON format
app.get('/orderList', (req, res) => {
    const orderFilePath = path.join(__dirname, 'orderList.json');

    fs.readFile(orderFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading order file:', err);
            return res.status(500).json({ error: 'Error reading orders' });
        }

        try {
            const orders = JSON.parse(data);

            // Return orders as JSON
            res.json(orders);
        } catch (parseError) {
            console.error('Error parsing order file:', parseError);
            res.status(500).json({ error: 'Error parsing orders' });
        }
    });
});


app.get("/signup", function (req, res) {
    res.render("signup");
});

app.post("/create", async function (req, res) {
    try {
        // Extracting email and password
        const { email, password } = req.body;

        // Validate the presence of email and password
        if (!email || !password) {
            return res.status(400).send("Email and password are required");
        }

        const emailValid = email.trim();
        const passwordValid = password.trim();

        // Check if email is already registered
        const user = await userModel.findOne({ email: emailValid });
        if (user) {
            return res.status(400).send("User already exists");
        }

        // Hash the password and create the user
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(passwordValid, salt);
        const createdUser = await userModel.create({ email: emailValid, password: hash });

        // Generate a token and set it as a cookie
        const token = jwt.sign({ email: createdUser.email }, "secret");
        res.cookie("token", token);
        res.status(201).send("Account registered. You can now log in.");
    } catch (error) {
        console.error("Error during user creation:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.get("/orders", isLoggedIn, async function (req, res) {
    let user = await userModel.findOne({ email: req.user.email });
    if (!user)
        res.send("You are not logged in")
    res.render("orders", { user });
})

// app.get("/orderHistory/create", async function (req, res) {
//     let orderHistory = await orderHistoryModel.create({
//         orderHistoryData: "Samosa",
//         user: "670ab1042ceeb6351ed8bc9e"
//     })

//     let user = await userModel.findOne({ _id: "670ab1042ceeb6351ed8bc9e" });
//     user.orderHistory.push(orderHistory._id);
//     await user.save();
//     res.send(orderHistory);
// })

app.get("/", function (req, res) {
    if(req.query.table){
        tableNumber = req.query.table;
        console.log(tableNumber);
    }
    res.render("index");
})

app.get("/logout", function (req, res) {
    res.cookie("token", "");
    res.redirect("/");
});

app.get("/home", isLoggedIn, async function (req, res) {
    let user = await userModel.findOne({ email: req.user.email });
    if (!user)
        res.send("You are not logged in")
    user.tableNumber = tableNumber;
    user.save();
    res.render("home", { user });
});

app.get("/menu", isLoggedIn, async function (req, res) {
    let user = await userModel.findOne({ email: req.user.email }).populate({
        path: 'bag',
        populate: {
            path: 'name',
            model: 'menu'
        }
    }).populate({
        path: 'gift',
        populate: {
            path: 'name',
            model: 'menu'
        }
    });

    if (!user)
        res.send("You are not logged in");
    let menu = await menuModel.find();
    res.render("menu", { user, menu });
});

app.get("/bag", isLoggedIn, async function (req, res) {

    // let user = await userModel.findOne({email:req.user.email});
    const user = await userModel.findOne({ email: req.user.email }).populate({
        path: 'bag',
        populate: {
            path: 'name', // Populate 'name' field in each Bag item, which refers to a menu item
            model: 'menu' // Ensure the model for 'name' is Menu
        }
    });

    if (!user)
        res.send("You are not logged in");

    res.render("bag", { user, bagItems: user.bag });
});

app.get("/gift", isLoggedIn, async function (req, res) {

    // let user = await userModel.findOne({email:req.user.email});
    const user = await userModel.findOne({ email: req.user.email }).populate({
        path: 'gift',
        populate: {
            path: 'name', // Populate 'name' field in each Bag item, which refers to a menu item
            model: 'menu' // Ensure the model for 'name' is Menu
        }
    });

    if (!user)
        res.send("You are not logged in");

    res.render("gift", { user });
});

app.get("/availableGifts", isLoggedIn, async function (req, res) {
    let user = await userModel.findOne({ email: req.user.email }).populate({
        path: 'availableGifts',
        populate: {
            path: 'name',
            model: 'gift'
        }
    });
    if (!user)
        res.send("You are not logged in")
    res.render("availableGifts", { user });
});

app.get("/sendGift", isLoggedIn, async function (req, res) {
    try {
        const user = await userModel.findOne({ email: req.user.email });

        if (!user) return res.send("You are not logged in");

        res.render("sendGift", { user });
    } catch (error) {
        console.error("Error in sendGift route:", error);
        res.status(500).send("Internal Server Error");
    }
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

app.post("/gift/increase/:id", isLoggedIn, async (req, res) => {
    try {
        const giftItem = await giftModel.findById(req.params.id);

        giftItem.quantity += 1; // Increment quantity
        await giftItem.save();
        return res.redirect("/gift");
    } catch (error) {
        res.status(500).send({ success: false, message: "Error incrementing quantity" });
    }
});

app.post("/gift/decrease/:id", isLoggedIn, async (req, res) => {
    try {
        const giftItem = await giftModel.findById(req.params.id);

        if (giftItem.quantity > 1) {
            giftItem.quantity -= 1; // Decrement quantity
            await giftItem.save();
        } else {
            // Optionally remove the item if quantity reaches 0
            await giftModel.findByIdAndDelete(req.params.id);
        }

        return res.redirect("/gift");
    } catch (error) {
        console.error("Error decrementing quantity:", error);
        res.status(500).send({ success: false, message: "Error decrementing quantity" });
    }
});

app.get("/confirmOrder", isLoggedIn, async function (req, res) {
    const user = await userModel.findOne({ email: req.user.email }).populate('bag');
    if(!user){
        return res.send("Not Logged in");
    }
    res.render("confirmOrder", {user});
});

app.post('/confirmOrder', isLoggedIn, async (req, res) => {
    try {
        const { email: enteredEmail } = req.body;

        if (!enteredEmail) {
            return res.send(`
                <h1>Email is required!</h1>
                <a href="/confirmOrder">Go back</a>
            `);
        }

        const user = await userModel.findOne({ email: req.user.email }).populate('bag');
        if (!user) {
            return res.send("<h1>User not found!</h1>");
        }

        if (enteredEmail.trim() === user.email.trim()) {
            const bagItems = user.bag || [];
            const orderData = {
                user: user._id,
                tableNumber: user.tableNumber || 'Unknown', // Include table number
                bag: bagItems.map(item => ({
                    id: item._id,
                    name: item.name,
                    quantity: item.quantity,
                })),
                date: new Date(),
            };

            // Save to file and database
            writeOrderToFile(orderData);

            const newOrder = new orderHistoryModel(orderData);
            await newOrder.save();

            // Add order to user's history and clear bag
            user.orderHistory.push(newOrder._id);
            user.bag = [];
            await user.save();

            res.redirect(`/finalOrder?bag=${encodeURIComponent(JSON.stringify(bagItems))}`);
        } else {
            res.send(`
                <h1>Email does not match!</h1>
                <a href="/confirmOrder">Go back</a>
            `);
        }
    } catch (error) {
        console.error("Error in confirmOrder:", error);
        res.status(500).send("Internal Server Error");
    }
});


function writeOrderToFile(orderData) {
    const orderFilePath = path.join(__dirname, 'orderList.json');

    fs.readFile(orderFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading order file:', err);
            return;
        }

        let orders = [];
        try {
            orders = JSON.parse(data); // Parse existing orders
        } catch (parseError) {
            console.error('Error parsing order file:', parseError);
        }

        orders.push(orderData); // Add new order

        fs.writeFile(orderFilePath, JSON.stringify(orders, null, 2), (writeErr) => {
            if (writeErr) {
                console.error('Error writing order file:', writeErr);
            } else {
                console.log('Order saved successfully with table number!');
            }
        });
    });
}


app.get("/finalOrder", isLoggedIn, async (req, res) => {
    try {
        const user = await userModel.findOne({ email: req.user.email }).populate({
            path: 'bag',
            populate: {
                path: 'name', // Populate 'name' field in each Bag item, which refers to a menu item
                model: 'menu' // Ensure the model for 'name' is Menu
            }
        });
        if (!user || user.bag.length === 0) {
            return res.send("<h1>Your order bag is empty!</h1>");
        }

        const orderData = {
            user: user.email,
            tableNumber: user.tableNumber || 'Unknown', // Include table number
            bag: user.bag,
            date: new Date(),
        };

        writeOrderToFile(orderData);

        const newOrder = new orderHistoryModel(orderData);
        await newOrder.save();

        user.orderHistory.push(newOrder._id);
        user.bag = [];
        await user.save();

        res.send(`
            <h1>Order Confirmed!</h1>
            <a href="/orderList">View Orders</a>
        `);
    } catch (error) {
        console.error("Error in finalOrder:", error);
        res.status(500).send("Internal Server Error");
    }
});


app.get("/profile", isLoggedIn, async function (req, res) {
    let user = await userModel.findOne({email:req.user.email});
    res.render("profile", {user});
});

// app.post("/upload", isLoggedIn, upload.single("pic"), function(req, res){
//     res.redirect("/menu");
// })

app.post("/addToBag/:id", isLoggedIn, async function (req, res) {
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

app.post("/addToGift/:id", isLoggedIn, async function (req, res) {
    try {
        // Fetch the logged-in user and populate their bag
        const user = await userModel.findOne({ email: req.user.email }).populate({
            path: 'gift',
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
        let giftItem = await giftModel.findOne({ name: menuItem._id });

        if (giftItem && user.gift.some(item => item.equals(giftItem._id))) {
            // If item exists in the user's bag, remove it

            // Filter out the item from the user's bag array
            // user.bag = user.bag.filter(item => !item.equals(bagItem._id));
            // Save the updated user document
            // await user.save();

            // Optionally remove the bag item from the Bag collection
            await giftModel.findByIdAndDelete(giftItem._id);

        } else {
            // If item doesn't exist in user's bag, add it

            giftItem = await giftModel.findOneAndUpdate(
                { name: menuItem._id },
                { $set: { name: menuItem._id, quantity: 1 } },
                { new: true, upsert: true } // Upsert to create if it doesn't exist
            );

            user.gift.push(giftItem._id); // Add the new bag item
            await user.save();
        }

        return res.redirect("/menu");

    } catch (error) {
        // Log detailed error for debugging
        console.error("Error during add/remove from gift:", error);
        res.status(500).send("Error updating gift");
    }
});

app.post("/addReceivedGift", isLoggedIn, async function (req, res) {
    try {
        // Fetch the logged-in user and populate their bag
        const user = await userModel.findOne({ email: req.user.email }).populate({
            path: 'bag',
            populate: {
                path: 'name',
                model: 'menu'
            }
        }).populate({
            path: 'gift',
            populate: {
                path: 'name',
                model: 'menu'
            }
        });

        if (!user) {
            console.error("User not found");
            return res.status(404).send("User not found");
        }

        const { email } = req.body;
        let rec = email.trim();

        const received = await userModel.findOne({ email: rec }).populate({
            path: 'availableGifts',
            populate: {
                path: 'name',
                model: 'gift'
            }
        });

        if (!received) {
            return res.send("receiver doesnot exist");
        }
        if (user.balance === undefined){
            user.balance = 0;
            user.save();
        }

        if (user.balance + user.giftTotal > 300) {
            console.log(user.balance);
            return res.send("Sorry cannot send gift due to limited amount. Try decreasing the bag value");
        }
        else {
            // Transfer gifts to the receiver's receivedGifts array
            const giftItemsArray = user.gift.map(gift => gift._id); // Extract the gift IDs

            if (giftItemsArray.length > 0) {
                // Wrap the items in the required structure
                const giftObject = { giftItem: giftItemsArray };
                received.availableGifts.push(giftObject); 
                console.log(user.balance);
            }

            // Update the user's balance
            user.balance = user.balance + user.giftTotal;

            // Clear the user's gift array
            user.gift = [];

            // Save both documents
            await user.save();
            await received.save();

            return res.send("Successfull");
        }

        // let arr = [];
        // for(let g of user.gift){
        //     arr.push(g._id);
        // }
        // received.availableGifts.push(arr);

        // user.balance = user.balance + user.giftTotal;
        // console.log(user.balance);
        // await user.save();

        // await received.save();

        // user.gift = [];
        // await user.save();

        // return res.send("Successful");
        // }

    } catch (error) {
        // Log detailed error for debugging
        console.error("Error during add/remove from bag:", error);
        res.status(500).send("Error updating bag");
    }
});


app.post("/", async function (req, res) {
    let user = await userModel.findOne({ email: req.body.email });
    if (user)
        bcrypt.compare(req.body.password, user.password, function (err, result) {
            if (result) {
                let token = jwt.sign({ email: user.email }, "secret");
                res.cookie("token", token);
                res.redirect("/home");
            }
            else
                res.send("Retry");
        })
    else
        return res.send("Something went wrong");
});

function isLoggedIn(req, res, next) {
    if (req.cookies.token === "")
        res.redirect("/");
    else {
        let data = jwt.verify(req.cookies.token, "secret");
        req.user = data;
        next();
    }
}

app.listen(PORT, function () {
    console.log("Smart Order starting");
});
