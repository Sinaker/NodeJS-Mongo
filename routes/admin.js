const isAdmin = require("../middleware/isAdmin");

const express = require("express");

const adminController = require("../controllers/admin");

const router = express.Router();

// /admin/add-product => GET
router.get("/add-product", isAdmin, adminController.getAddProduct);

// // /admin/products => GET
router.get("/products", isAdmin, adminController.getProducts);

// /admin/add-product => POST
router.post("/add-product", isAdmin, adminController.postAddProduct);

router.get("/edit-product/:productId", isAdmin, adminController.getEditProduct);

router.post("/edit-product", isAdmin, adminController.postEditProduct);

router.post("/delete-product", isAdmin, adminController.postDeleteProduct);

module.exports = router;
