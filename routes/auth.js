const express = require("express");

const authController = require("../controllers/auth");

const router = express.Router();

router.get("/login", authController.getLogin);
router.post("/login", authController.postLogin);
router.post("/logout", authController.postLogout);

router.get("/signup", authController.getSignUp);
router.post("/signup", authController.postSignUp);

router.get("/setpassword/:token", authController.getNewPass);
router.post("/setpassword/", authController.postNewPass);

router.get("/resetpassword", authController.getResetPass);
router.post("/resetpassword", authController.postResetPass);
module.exports = router;
