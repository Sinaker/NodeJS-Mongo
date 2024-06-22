const User = require("../models/user");

exports.getLogin = (req, res, next) => {
  //A cookie is sent on every response, it can be accessed by
  res.render("auth/login", {
    path: "/login",
    pageTitle: "Login",
    isAdmin: req.session.isAdmin,
  });
};

exports.postLogin = (req, res, next) => {
  //A cookie can be said as  global variable restricited to only one user

  //Based on the value of isAdmin we wish to show admin tabs, and set user only if logged in
  User.findById("6673c2831a6b3d39d406486e")
    .then((user) => {
      req.session.isAdmin = true; //Using session
      req.session.user = user;
      req.session.save((err) => {
        console.log(err);
        res.redirect("/"); //Will redirect once session is saved
      });
    })
    .catch((err) => {
      throw err;
    });

  //Note: If we had used req.isAdmin = true, this would have died as we finish the request hence we use cookies to have info that doesnt die
};

exports.postLogout = (req, res, next) => {
  //Delete session
  req.session.destroy(() => {
    res.redirect("/");
  });
};
