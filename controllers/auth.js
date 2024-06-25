const User = require("../models/user");
const bcryptjs = require("bcryptjs");
const nodemailer = require("nodemailer"); //Using Brevo
const ejs = require("ejs");
const path = require("path");
const crypto = require("node:crypto");
const { validationResult } = require("express-validator");

const p = path.join(__dirname, "..", "templates");

const transporter = nodemailer.createTransport({
  host: "live.smtp.mailtrap.io",
  port: 587,
  secure: false,
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS,
  },
});

exports.getLogin = (req, res, next) => {
  //A cookie is sent on every response, it can be accessed by
  res.render("auth/login", {
    path: "/login",
    pageTitle: "Login",
    errorMsg: req.flash("Error"),
    errors: [],
    oldInput: { email: "", password: "" },
  });
};

exports.postLogin = (req, res, next) => {
  const errors = validationResult(req);
  const email = req.body.email;
  const password = req.body.password;

  if (!errors.isEmpty()) {
    return res.status(422).render("auth/login", {
      path: "/login",
      pageTitle: "Login",
      errorMsg: errors.array()[0].msg,
      errors: errors.array(),
      oldInput: { email: email, password: password },
    });
  }

  User.findOne({ email: email })
    .then((user) => {
      //User will always exist cuz of our validation

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
          return res.status(422).render("auth/login", {
            path: "/login",
            pageTitle: "Login",
            errorMsg: "Incorrect Password",
            errors: [{ path: "password" }],
            oldInput: { email: req.body.email, password: req.body.password },
          });
        })
        .catch((err) => {
          console.log(err);
          res.redirect("/login");
        });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error); //Activated error middleware
    });
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
    oldInput: {
      email: "",
      password: "",
      confirmPassword: "",
    },
    errors: [],
  });
};

exports.postSignUp = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const cnfpassword = req.body.confirmPassword;
  const errors = validationResult(req);
  console.log(errors.array());

  if (!errors.isEmpty()) {
    return res.status(422).render("auth/signup", {
      path: "/signup",
      pageTitle: "Sign Up",
      errorMsg: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password,
        confirmPassword: cnfpassword,
      },
      errors: errors.array(),
    });
  }
  // Check if passwords match
  if (password !== cnfpassword) {
    return res.redirect("/signup");
  }

  // Hash the password and save the new user
  //The second arg shows the number of times algorithm should be applied
  bcryptjs
    .hash(password, 12)
    .then((hashedPass) => {
      const newUser = new User({
        email: email,
        password: hashedPass,
        cart: { items: [] },
      });
      return newUser.save();
    })
    .then((result) => {
      const emailData = {
        companyName: "Shop-NodeJS",
        firstName: email,
        link1: "http://example.com/getting-started",
        link2: "http://example.com/support",
        link3: "http://example.com/community",
        year: new Date().getFullYear(),
        companyAddress: "123 Company St, City, Country",
      };

      ejs
        .renderFile(path.join(p, "WelcomeEmail.ejs"), emailData)
        .then((html) => {
          const mailOptions = {
            from: "info@demomailtrap.com",
            to: process.env.EMAIL,
            subject: "Thank you for using Shop!",
            text:
              "If you recieved this mail you have signed-in successfully!\nYour email is: " +
              email,
            html: html,
          };

          transporter
            .sendMail(mailOptions)
            .then((res) => console.log("Email sent " + res.response))
            .catch((err) => {
              const error = new Error(err);
              error.httpStatusCode = 500;
              next(error); //Activated error middleware
            });
        });

      res.redirect("/login");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error); //Activated error middleware
    });
};

exports.getResetPass = (req, res, next) => {
  res.render("auth/resetpass", {
    path: "/resetpassword",
    pageTitle: "Reset Your Password",
    errorMsg: req.flash("Error"),
  });
};

exports.postResetPass = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      return res.redirect("/resetpassword");
    }

    const token = buffer.toString("hex");

    User.findOne({ email: req.body.email })
      .then((user) => {
        if (!user) {
          req.flash("Error", "No account exists with this user");
          return res.redirect("/resetpassword");
        }

        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 60 * 60 * 1000; //1 hr in milliseconds
        return user.save();
      })

      .then((result) => {
        res.redirect("/");
        //If sucessful send mail to that email
        const emailData = {
          companyName: "Shop-NodeJS",
          firstName: req.body.email,
          resetLink: `http://localhost:3000/setpassword/${token}`,
          year: new Date().getFullYear(),
          companyAddress: "123 Company St, City, Country",
        };

        return ejs.renderFile(path.join(p, "PassRecovery.ejs"), emailData);
      })

      .then((html) => {
        const mailOptions = {
          from: "support@demomailtrap.com",
          to: process.env.EMAIL,
          subject: "Password Recovery for Shop-NodeJS",
          html: html,
        };
        return transporter.sendMail(mailOptions);
      })
      .then((res) => console.log("Email sent " + res.response))
      .catch((err) => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        next(error); //Activated error middleware
      });
  });
};

exports.getNewPass = (req, res, next) => {
  const token = req.params.token;

  User.findOne({
    resetToken: token,
    resetTokenExpiration: { $gt: Date.now() },
  }) //CHecks current token and expiration date

    .then((user) => {
      if (!user) {
        req.flash("Error", "Session Expired!");
        return res.redirect("/resetpassword");
      }

      res.render("auth/newpass", {
        path: "/setpassword",
        pageTitle: "Set your new Password",
        errorMsg: req.flash("Error"),
        userID: user._id.toString(),
        resetToken: token,
      });
    });
};

exports.postNewPass = (req, res, next) => {
  const token = req.body.resetToken;
  const userID = req.body.userID;
  const newPass = req.body.password;
  console.log(token, userID, newPass);
  let fetched_user;

  User.findOne({
    _id: userID,
    resetToken: token,
    resetTokenExpiration: { $gt: Date.now() },
  })
    .then((user) => {
      if (!user) {
        req.flash("Error", "Invalid Token, please try again");
        return res.redirect("/resetpassword");
      }

      fetched_user = user;
      return bcryptjs.hash(newPass, 12);
    })

    .then((hashedPass) => {
      fetched_user.password = hashedPass;
      fetched_user.resetToken = null;
      fetched_user.resetTokenExpiration = null;
      return fetched_user.save();
    })

    .then(() => res.redirect("/login"))
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error); //Activated error middleware
    });
};
