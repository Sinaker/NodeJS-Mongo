const fs = require("fs");
const path = require("path");
const Product = require("../models/product");
const User = require("../models/user");
const Order = require("../models/order");
const pdfKit = require("pdfkit");

const ITEMS_PER_PAGE = 2;

exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalProducts = 0;

  Product.countDocuments()
    .then((numProd) => {
      totalProducts = numProd;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE) //Skip the first 'x' items
        .limit(ITEMS_PER_PAGE); //Render only ITEMS_PER_PAGE products
    })
    .then((products) => {
      res.render("shop/product-list", {
        prods: products,
        pageTitle: "All Products",
        path: "/products",
        currentPage: page,
        lastPage: Math.ceil(totalProducts / ITEMS_PER_PAGE),
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error); //Activated error middleware
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      res.render("shop/product-detail", {
        product: product,
        pageTitle: product.title,
        path: "/products",
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error); //Activated error middleware
    });
};

exports.getIndex = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalProducts = 0;

  Product.countDocuments()
    .then((numProd) => {
      totalProducts = numProd;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE) //Skip the first 'x' items
        .limit(ITEMS_PER_PAGE); //Render only ITEMS_PER_PAGE products
    })
    .then((products) => {
      res.render("shop/index", {
        prods: products,
        pageTitle: "Shop",
        path: "/",
        successMsg: req.flash("Success"),
        firstPage: 1,
        currentPage: page,
        lastPage: Math.ceil(totalProducts / ITEMS_PER_PAGE),
      });
    })
    .catch((err) => {
      const error = new Error(err);
      console.log(err);
      error.httpStatusCode = 500;
      next(error); //Activated error middleware
    });
};

exports.getCart = (req, res, next) => {
  User.findById(req.user._id)
    .populate("cart.items.productID")
    .exec()
    .then((user) => {
      res.render("shop/cart", {
        path: "/cart",
        pageTitle: "Your Cart",
        products: user.cart.items,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error); //Activated error middleware
    });
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then((product) => {
      return req.user.addToCart(product);
    })
    .then((result) => {
      console.log(result);
      res.redirect("/cart");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error); //Activated error middleware
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .removeFromCart(prodId)
    .then((result) => {
      res.redirect("/cart");
    })
    .catch((err) => console.log(err));
};

exports.postOrder = (req, res, next) => {
  User.findById(req.user._id)
    .populate("cart.items.productID")
    .exec()
    .then((user) => {
      const products = user.cart.items.map((item) => {
        return { quantity: item.quantity, product: { ...item.productID._doc } };
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user, //mongoose by default replaces object with it's id
        },
        products: products,
      });
      return order.save();
    })
    .then((result) => {
      //We also have to clear the cart
      return req.user.clearCart();
    })
    .then(() => res.redirect("/orders"))
    .catch((err) => console.log(err));
};

exports.getOrders = (req, res, next) => {
  Order.find({ "user.userId": req.user._id })
    .then((orders) => {
      res.render("shop/orders", {
        path: "/orders",
        pageTitle: "Your Orders",
        orders: orders,
      });
    })
    .catch((err) => console.log(err));
};

exports.getInvoice = (req, res, next) => {
  const orderID = req.params.orderID;
  const filename = "invoice - " + orderID + ".pdf";
  const invoicePath = path.join(__dirname, "..", "data", "Invoice", filename);

  //Security check
  Order.findById(orderID).then((order) => {
    if (!order) return next(new Error("Invalid Object"));
    if (order.user.userId.toString() !== req.user._id.toString())
      return next(new Error("Unauthorized"));

    // This method is bad for large files we should use chunks
    // fs.readFile(
    //   path.join(__dirname, "..", "data", "Invoice", "Resume.pdf"),
    //   (err, data) => {
    //     if (err) {
    //       console.log(err);
    //       return next(err);
    //     }

    //     res.setHeader("Content-Type", "application/pdf");
    //     res.setHeader(
    //       "Content-Disposition",
    //       "inline;  filename=" + filename + ".pdf"
    //       // "attachment; filename=" + filename + ".pdf" //This will start automatic download
    //     );
    //     res.send(data);
    //   }
    // );

    // Using chunks
    //   const file = fs.createReadStream(
    //     path.join(
    //       __dirname,
    //       "..",
    //       "data",
    //       "Invoice",
    //       "B. V. Ramana - Higher Engineering Mathematics (2).pdf"
    //     )
    //   );

    //   res.setHeader("Content-Type", "application/pdf");
    //   res.setHeader(
    //     "Content-Disposition",
    //     "inline;  filename=" + filename + ".pdf"
    //     // "attachment; filename=" + filename + ".pdf" //This will start automatic download
    //   );

    //   file.pipe(res); //res object is a writable stream

    // Using PdkKit
    const pdfDoc = new pdfKit();
    pdfDoc.pipe(fs.createWriteStream(invoicePath));
    pdfDoc.pipe(res);

    pdfDoc.fontSize(26).text("Invoice", { underline: true });
    pdfDoc.text("-----------------------");
    let totalPrice = 0;
    console.log(order.products);
    order.products.forEach((prod) => {
      totalPrice += prod.quantity * prod.product.price;
      pdfDoc
        .fontSize(14)
        .text(
          prod.product.title +
            " - " +
            prod.quantity +
            " x " +
            "$" +
            prod.product.price
        );
    });
    pdfDoc.text("---");
    pdfDoc.fontSize(20).text("Total Price: $" + totalPrice);

    pdfDoc.end();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "inline;  filename=" + filename + ".pdf"
      // "attachment; filename=" + filename + ".pdf" //This will start automatic download
    );
  });
};
