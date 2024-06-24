const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  resetToken: { type: String }, //Note that this is not required
  resetTokenExpiration: { type: Date },
  cart: {
    items: [
      {
        productID: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: { type: Number, required: true },
      },
    ],
  },
});

userSchema.methods.addToCart = function (product) {
  //Step 1: Get user based on this._id
  //Step 2: Search cart.items
  //Step 3: if product._id does not exists then add to product._id and set quantity to 1
  //Step 4: else findIndex and increment quantity by 1
  //Step 5: Update the user

  //Note this contains the current user, so you don't have to findById
  const matched_product_index = this.cart.items.findIndex(
    (item) => item["productID"].toString() === product._id.toString()
  );
  if (matched_product_index >= 0)
    this.cart.items[matched_product_index]["quantity"] += 1;
  else this.cart.items.push({ productID: product._id, quantity: 1 });

  this.save() //Update complete
    .then(() => console.log("PRODUCT ADDED TO CART!"))
    .catch((err) => {
      throw err;
    });
};

userSchema.methods.removeFromCart = function (prodID) {
  //Arrow functions do not have their own this context; instead, they inherit this from the surrounding lexical context
  const updatedItems = this.cart.items.filter(
    (item) => item["productID"].toString() !== prodID.toString()
  );

  this.cart.items = updatedItems;

  return this.save() //Update complete
    .then(() => console.log("PRODUCT DELETED FROM CART!"))
    .catch((err) => {
      throw err;
    });
};

userSchema.methods.clearCart = function () {
  this.cart = { items: [] }; //Reinitialise to empty array
  return this.save();
};

module.exports = mongoose.model("Users", userSchema);
