const express = require("express");
const User = require("../models/user");
const { check } = require("express-validator"); //This provides express middlewares

const authController = require("../controllers/auth");

const router = express.Router();

router.get("/login", authController.getLogin);

router.post(
  "/login",
  [
    check("email", "Invalid Email.")
      .trim()
      .isEmail()
      .normalizeEmail()
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then((user) => {
          if (!user) return Promise.reject("Email does not exist!");
        });
      }),

    check("password", "Password should have at least 5 alphanumeric characters")
      .isLength({ min: 5 })
      .isAlphanumeric(),
  ],
  authController.postLogin
);
router.post("/logout", authController.postLogout);

router.get("/signup", authController.getSignUp);
router.post(
  "/signup",
  [
    check("email")
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage("Invalid Email.")
      .custom((value, { req }) => {
        return User.findOne({ email: value }) //If user already exists
          .then((user) => {
            if (user) {
              return Promise.reject("Email already Exists!");
            }
          });
      }),

    check("password", "Password must be more than 5 alphanumeric characters")
      .isLength({ min: 5 })
      .isAlphanumeric(),

    check("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.password)
        throw new Error("Passwords do not match");

      return true;
    }),
  ],
  authController.postSignUp
);

router.get("/setpassword/:token", authController.getNewPass);
router.post("/setpassword/", authController.postNewPass);

router.get("/resetpassword", authController.getResetPass);
router.post("/resetpassword", authController.postResetPass);
module.exports = router;
