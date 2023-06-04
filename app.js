//jshint esversion:6
require('dotenv').config();

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require ("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();



app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended:true
}));


app.use(session({
    secret : "Our little Secret.",
    resave : false,
    saveUninitialized: true
   
}));

app.use(passport.initialize());
app.use(passport.session());


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

userSchema.plugin(passportLocalMongoose);


const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



app.get("/", (req, res)=>{
    res.render("home");
});

app.get("/register", (req, res)=>{
    res.render("register");
});

app.get("/login", (req, res)=>{
    res.render("login");
    
});


app.get("/secrets", (req, res)=>{
  if(req.isAuthenticated()){
    console.log("success");
    res.render("secrets");
  }else{
    console.log("fail");
    res.redirect("/login");
  }

});

app.get('/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});


app.post("/register", (req, res)=>{

User.register({username: req.body.username}, req.body.password, (err, user)=>{
  if(err) {
    console.log(err);
    res.redirect("/register");
  }else{
    
    passport.authenticate("local")(req, res, function(){
      res.redirect("/secrets");
    });
  }
});


});

app.post("/login", (req, res) => {

  const user = new User({
    username: req.body.username,
    password: req.body.password
 });
 req.login(user, (err)=>{
  if(err){
    console.log(err);
  }else{
    passport.authenticate("local")(req,res, ()=>{
      res.redirect("/secrets");
    });
  }
 });
    
  });




app.listen(3000, ()=>{
    console.log("server started on port 3000");
});