const User = require("../models/user");
const bcryptjs = require("bcryptjs");

exports.getLogin = (req, res, next) => {
  //A cookie is sent on every response, it can be accessed by
  res.render("auth/login", {
    path: "/login",
    pageTitle: "Login",
    isAdmin: req.session.isAdmin,
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  let fetched_user = null;

  //A cookie can be said as  global variable restricited to only one user

  //Based on the value of isAdmin we wish to show admin tabs, and set user only if logged in
  User.findOne({ email: email })
    .then((user) => {
      if (!user) return res.redirect("/login");

      fetched_user = user;
      return bcryptjs.compare(password, user.password);
    })
    .then((isMatching) => {
      if (isMatching) {
        //password is matching
        req.session.isAdmin = true; //Using session
        req.session.user = fetched_user;
        return req.session.save((err) => {
          console.log(err);
          res.redirect("/"); //Will redirect once session is saved
        });
      }
      res.redirect("/login"); //In case passwords are not matching
    })
    .catch((err) => {
      console.log(err);
      res.redirect("/login");
    });

  //Note: If we had used req.isAdmin = true, this would have died as we finish the request hence we use cookies to have info that doesnt die
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
    isAdmin: req.session.isAdmin,
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
      res.status(500).send("Server error");
    });
};
