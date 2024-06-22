const path = require("path");

require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const csrf = require("csurf");
const flash = require("connect-flash");

const MONGODB_URI = process.env.MONGODB_CONNECTION;

const errorController = require("./controllers/error");

const app = express();
const store = new MongoDBStore({ uri: MONGODB_URI, collection: "Session" });
const csrufProtection = csrf();

app.set("view engine", "ejs");
app.set("views", "views");

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

app.use(csrufProtection);

const User = require("./models/user");

app.use((req, res, next) => {
  if (!req.session.user) {
    //If session does not exist
    next();
  } else {
    User.findById(req.session.user._id)
      .then((user) => {
        req.user = user; //Trying to
        next();
      })
      .catch((err) => {
        throw err;
      });
  }
});

app.use((req, res, next) => {
  res.locals.isAdmin = req.session.isAdmin;
  res.locals.csrfToken = req.csrfToken();
  next();
}); //Such variables will be available to every rendered view

app.use(flash());

app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use(errorController.get404);

mongoose
  .connect(MONGODB_URI)
  .then((result) => {
    app.listen(3000);
  })
  .catch((err) => {
    console.log(err);
  });
