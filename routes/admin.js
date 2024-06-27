const express = require("express");

const adminController = require("../controllers/admin");
const isAdmin = require("../middleware/isAdmin");
const { check } = require("express-validator");

const router = express.Router();

// /admin/add-product => GET
router.get("/add-product", isAdmin, adminController.getAddProduct);

// // /admin/products => GET
router.get("/products", isAdmin, adminController.getProducts);

// /admin/add-product => POST
router.post(
  "/add-product",
  isAdmin,
  [
    check("title", "Enter Title").notEmpty().isString().trim(),
    check("price", "Enter Price").isFloat(),
    check("description").isLength({ min: 5, max: 400 }),
  ],
  adminController.postAddProduct
);

router.get("/edit-product/:productId", isAdmin, adminController.getEditProduct);

router.post(
  "/edit-product",
  isAdmin,
  [
    check("title", "Enter Title").notEmpty().isString().trim(),
    check("price", "Enter Price").isFloat(),
    check("description").isLength({ min: 5, max: 400 }),
  ],
  adminController.postEditProduct
);

router.delete(
  "/product/delete/:productId",
  isAdmin,
  adminController.deleteProduct
);

module.exports = router;
