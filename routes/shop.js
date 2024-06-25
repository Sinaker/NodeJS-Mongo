const express = require("express");

const shopController = require("../controllers/shop");
const isAdmin = require("../middleware/isAdmin");

const router = express.Router();

router.get("/", shopController.getIndex);

router.get("/products", shopController.getProducts);

router.get("/products/:productId", shopController.getProduct);

router.get("/cart", isAdmin, shopController.getCart);

router.post("/cart", isAdmin, shopController.postCart);

router.post("/cart-delete-item", isAdmin, shopController.postCartDeleteProduct);

router.post("/create-order", isAdmin, shopController.postOrder);

router.get("/orders", isAdmin, shopController.getOrders);

router.get("/orders/:orderID", isAdmin, shopController.getInvoice);

module.exports = router;
