//jshint esversion:6
require('dotenv').config();

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require ("ejs");
const mongoose = require("mongoose");
const md5 = require("md5");

const app = express();



app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended:true
}));


const dburl = "mongodb+srv://akhiltmannarkkad:akhiltmannarkkad@cluster0.w5cnisx.mongodb.net/userDB?retryWrites=true&w=majority";

mongoose.connect(dburl)
.then(()=>{
    console.log("connected to mongodb database");
})
.catch((error)=>{
    console.error("mongodb connection error", error);
});

const userSchema =new mongoose.Schema ({
    email: String,
    password: String
});



const User = new mongoose.model("User", userSchema);



app.get("/", (req, res)=>{
    res.render("home");
});


app.get("/login", (req, res)=>{
    res.render("login");
    
});


app.get("/register", (req, res)=>{
    res.render("register");
});


app.post("/register", (req, res)=>{
const newUser = new User({
    email: req.body.username,
    password: md5(req.body.password)
});

newUser.save()
.then(()=>{
    res.render("secrets");
})
.catch((err)=>{
    console.log(err);
});
});


app.post("/login", (req,res)=>{
const username = req.body.username;
const password = req.body.password;


User.findOne({ email: username })
  .then((foundUser) => {
    if (foundUser && foundUser.password === password) {
        
      res.render("secrets");
    }
  })
  .catch((err) => {
    console.log(err);
  });
});



app.listen(3000, ()=>{
    console.log("server started on port 3000");
});