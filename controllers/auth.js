const User = require("../models/user");
const bcryptjs = require("bcryptjs");

exports.getLogin = (req, res, next) => {
  //A cookie is sent on every response, it can be accessed by
  res.render("auth/login", {
    path: "/login",
    pageTitle: "Login",
    errorMsg: req.flash("Error"),
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        req.flash("Error", "Invalid Email-ID");
        return res.redirect("/login");
      }
      bcryptjs
        .compare(password, user.password)
        .then((doMatch) => {
          if (doMatch) {
            req.session.isAdmin = true;
            req.session.user = user;
            return req.session.save((err) => {
              console.log(err);

              req.flash("Success", "Login Successful!");
              res.redirect("/");
            });
          }
          req.flash("Error", "Invalid Password");
          return res.redirect("/login");
        })
        .catch((err) => {
          console.log(err);
          res.redirect("/login");
        });
    })
    .catch((err) => console.log(err));
};

exports.postLogout = (req, res, next) => {
  //Delete session
  req.session.destroy(() => {
    res.redirect("/");
  });
};

exports.getSignUp = (req, res, next) => {
  res.render("auth/signup", {
    path: "/signup",
    pageTitle: "Sign Up",
    errorMsg: req.flash("Error"),
  });
};

exports.postSignUp = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const cnfpassword = req.body.confirmPassword;

  // Check if passwords match
  if (password !== cnfpassword) {
    return res.redirect("/signup");
  }

  // Check if the user already exists
  User.findOne({ email: email })
    .then((user) => {
      if (user) {
        req.flash("Error", "Email Already Exists!");
        return res.redirect("/signup");
      }

      // Hash the password and save the new user
      //The second arg shows the number of times algorithm should be applied
      return bcryptjs.hash(password, 12).then((hashedPass) => {
        const newUser = new User({
          email: email,
          password: hashedPass,
          cart: { items: [] },
        });
        return newUser.save();
      });
    })
    .then((result) => {
      res.redirect("/login");
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send("Server Error");
    });
};
