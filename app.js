const path = require("path");

require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);

const MONGODB_URI = process.env.MONGODB_CONNECTION;

const errorController = require("./controllers/error");

const app = express();
const store = new MongoDBStore({ uri: MONGODB_URI, collection: "Session" });

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
app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use(errorController.get404);

mongoose
  .connect(MONGODB_URI)
  .then((result) => {
    User.findOne() //With no args this sends the the first object in db
      .then((user) => {
        if (!user) {
          //If user is not defined, create user
          const user = new User({
            name: "Dummy",
            email: "test@test.com",
            cart: { items: [] },
          });
          user.save();
        }
      })
      .catch((err) => console.log("err in fetching one user"));

    app.listen(3000);
  })
  .catch((err) => {
    console.log(err);
  });
