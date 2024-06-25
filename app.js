const path = require("path");

require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const csrf = require("csurf");
const flash = require("connect-flash");
const multer = require("multer");

const MONGODB_URI = process.env.MONGODB_CONNECTION;

const errorController = require("./controllers/error");

const app = express();
const store = new MongoDBStore({ uri: MONGODB_URI, collection: "Session" });
const csrufProtection = csrf();

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  )
    cb(null, true);
  else cb(null, false);
};

app.set("view engine", "ejs");
app.set("views", "views");

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);

//Express serves these contents as if they were in the root
app.use(express.static(path.join(__dirname, "public")));

//Hence added 'images'
app.use("/images", express.static(path.join(__dirname, "images")));
//Make sure to add a '/' in the imageUrl to have absolute URL
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
    return next();
  }
  User.findById(req.session.user._id)
    .then((user) => {
      if (!user) return next();
      req.user = user; //Trying to
      next();
    })
    .catch((err) => {
      console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error); //Activated error middleware
    });
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

app.get("/500", errorController.get500);
app.use(errorController.get404);

app.use((error, req, res, next) => {
  res.status(500).render("500", {
    pageTitle: "Internal Error",
    path: "/500",
    isAdmin: false,
  });
}); //Special Error middleware

mongoose
  .connect(MONGODB_URI)
  .then((result) => {
    app.listen(3000);
  })
  .catch((err) => {
    const error = new Error(err);
    error.httpStatusCode = 500;
    next(error); //Activated error middleware
  });
