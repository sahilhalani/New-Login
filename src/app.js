const express = require("express"); //requiring express
const hbs = require("hbs"); //requiring template engine hbs for front-end
const path = require("path"); //requiring path for giving static path
const bcrypt = require("bcrypt"); //requiring bcrypt module for verify hassed password
const cookieParser = require('cookie-parser');
const nodemailer = require("nodemailer");
const url = require('url');
const jwt = require("jsonwebtoken");


require('dotenv').config();
const myCollection = require("./models/register"); // importing schema &module
require("./db/connection"); // connecting db file
const auth = require("./middleware/auth");
const {
    response
} = require("express");



const app = express(); //stroing express in app to use it



const port = process.env.PORT || 5000; // declaring universasl port
const staticpath = path.join(__dirname, "../templates/pages"); //path to pages
const cssPath = path.join(__dirname, "../public"); // path for css files
const partials = path.join(__dirname, "../templates/partials"); //path for partials


app.use(express.static(cssPath)); // using express.static for loading css 
app.use(express.json()); //to read json format
app.use(express.urlencoded({
    extended: false
}));
app.use(cookieParser());

app.set("view engine", "hbs"); //setting view engine
app.set("views", staticpath); // setting view engine to different folder 
hbs.registerPartials(partials); //method for partials



app.get("/", auth, (req, res) => {
    res.render("index", {
        title: 'Home',
        name: req.user.firstname
    })
});

app.get("/register", (req, res) => {
    res.render("register", {
        title: 'Register',
    })
});

app.get("/login", (req, res) => {
    res.render("login", {
        title: 'Login',
        sucess:req.query.sucess
    })
});

app.get("/recover", (req, res) => {
    res.render("recover", {
        title: 'Forgot Password',
    })
});

app.get("/resetPassword/:id/:token", async (req, res) => {
    try {

        const {
            id,
            token
        } = req.params;
        const user = await myCollection.findOne({
            _id: id
        })
        const secret = process.env.jsonkey + user.password;
        try {
            const payload = jwt.verify(token, secret)
            res.render("resetPassword")

        } catch (error) {
            console.log("Token Not Verified on get.resetPassword page");
        }


    } catch (error) {
        console.log("There's an error in get resetPassword");
        res.send("invalid id")
    }


});

app.get("/emailSent", (req, res) => {
    res.render("emailSent", {
        title: 'Email Sent',
        Email: req.query.email

    })
});

app.get("/resetSuccessful", (req, res) => {
    res.render("resetSuccessful")
});


// Submitting data
app.post("/register", async (req, res) => {

    try {
        const password = req.body.password
        const cpassword = req.body.cpassword

        if (password === cpassword) {

            const registerData = new myCollection({
                firstname: req.body.fname,
                email: req.body.email,
                password: req.body.password,
                confirmpassword: req.body.cpassword
            })
            // console.log("The registered user is " + registerData);


            //Generating token 
            const token = await registerData.generateAuthToken();


            //storing token in browser cookie
            res.cookie("jwt", token, {
                expires: new Date(Date.now() + 50000),
                httpOnly: true
            })

            const save = await registerData.save();
            res.status(201).redirect("/");
        } else {
            res.send("Password Doesn't Match")
            console.log("Password Doesn't Match");
        }

    } catch (error) {
        res.status(400).send(error);
        console.log("This a error of post register on app.js ", error);
    }
});


//Login code
app.post("/login", async (req, res) => {
    try {
        const loginEmail = req.body.email
        const password = req.body.password

        const result = await myCollection.findOne({
            email: loginEmail
        });

        //checking password which user entering with bcrypted in databse
        const isMatch = await bcrypt.compare(password, result.password);

        //Generating Token
        const token = await result.generateAuthToken();


        //storing token in browser cookie
        res.cookie("jwt", token, {
            expires: new Date(Date.now() + 300000),
            httpOnly: true
        })


        if (isMatch) {
            res.status(200).redirect("/");
        } else {
           res.render('login',{
               sucess:true
           })
        }

    } catch (error) {
        console.log("Login code error on page app.js", error);
    }
});

//log out
app.get("/logout", auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((BToken) => {
            return BToken.token !== req.token
        })
        res.clearCookie("jwt");
        await req.user.save();
        res.redirect("login");
    } catch (error) {
        res.status(500).send(error)
        console.log("There's an error in log-out", error);
    }
});


//Forgot Password

app.post("/recover", async (req, res) => {
    try {
        const inputEmail = req.body.email;
        const user = await myCollection.findOne({
            email: inputEmail
        });
        if (user) {
            const secret = process.env.jsonkey + user.password
            // console.log(secret);
            const payload = {
                email: user.email,
                id: user.id,
            };
            // console.log(payload);
            const token = jwt.sign(payload, secret, {
                expiresIn: '15m'
            });
            var link = `http://localhost:5000/resetPassword/${user.id}/${token}`;
            console.log(link);




            // Sending email
            const transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 465,
                secure: true,
                auth: {
                    user: "chotachetan107@gmail.com",
                    pass: process.env.mailpass
                }
            });

            const mailOPtion = {
                from: "chotachetan107@gmail.com",
                to: user.email,
                subject: "Reset Password",
                text: link
            };

            transporter.sendMail(mailOPtion, function (error, info) {
                if (error) {
                    console.log("There's an error in sending mail", error)
                } else {
                    console.log("Email Sent:" + info.response);
                }
            });

            res.redirect(url.format({
                pathname: "emailSent",
                query: {
                    email: inputEmail
                }
            }))
        } else {
            res.send("User Doesn't Exist")
        }

    } catch (error) {
        console.log("There's an error in Forgot password", error);
    }
});

app.post("/resetPassword/:id/:token", async (req, res, next) => {
    const {
        id,
        token
    } = req.params;
    const npassword = req.body.password
    const cpassword = req.body.cpassword
    const user = await myCollection.findOne({
        _id: id
    })
    const updateId = user.id
    const secret = process.env.jsonkey + user.password;

    try {
        const payload = jwt.verify(token, secret)
        if (npassword === cpassword) {
            hashPass = await bcrypt.hash(req.body.password, 10);
            const result = await myCollection.findByIdAndUpdate({
                _id: updateId
            }, {
                $set: {
                    password: hashPass
                }
            });



            res.redirect("/resetSuccessful")
        } else {
            console.log("Password Doesn't match");
        }

    } catch (error) {
        console.log("error in post.resetpassword", error);
    }
})


app.listen(port, () => {
    console.log("Lisitening Boss");
})