//jshint esversion:6
require('dotenv').config();

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require ("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const  findOrCreate = require('mongoose-findorcreate');

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
    password: String,
    googleId: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    cb(null, { id: user.id, username: user.username });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});


passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/secrets"
  
},
function(accessToken, refreshToken, profile, cb) {
  console.log(profile);
  User.findOrCreate({ googleId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));



app.get("/", (req, res)=>{
    res.render("home");
});

app.get("/")


app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] })
);

app.get("/auth/google/secrets", 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect('/secrets');
  });

app.get("/register", (req, res)=>{
    res.render("register");
});

app.get("/login", (req, res)=>{
    res.render("login");
    
});


app.get("/secrets", (req, res) => {
  User.find({ "secret": { $ne: null } })
    .then(foundUsers => {
      res.render("secrets", { usersWithSecrets: foundUsers });
    })
    .catch(err => {
      console.log(err);
    });
});



app.get("/submit", (req,res)=>{
  if(req.isAuthenticated()){
   res.render("submit");
  }else{
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


  app.post("/submit", (req, res) => {
    const submittedSecret = req.body.secret;
  
    User.findById(req.user.id)
      .then(foundUser => {
        if (foundUser) {
          foundUser.secret = submittedSecret;
          return foundUser.save();
        } else {
          throw new Error("User not found");
        }
      })
      .then(() => {
        res.redirect("/secrets");
      })
      .catch(err => {
        console.log(err);
      });
  });
  



app.listen(3000, ()=>{
    console.log("server started on port 3000");
});