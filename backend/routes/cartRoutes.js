<<<<<<< HEAD
/** Express API endpoints for cart routes; handlers connect HTTP requests to authorization, database operations, and JSON responses. */

=======
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");

const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Vendor = require("../models/Vendor");
const authMiddleware = require("../middleware/authMiddleware");
const approvedVendorOnly = require("../middleware/approveVendorOnly");

/* ================= ADD TO CART ================= */
<<<<<<< HEAD
// POST /add: Adds a product quantity to the signed-in vendor active cart.
=======
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
router.post(
  "/add",
  authMiddleware,
  approvedVendorOnly,
  async (req, res) => {
    try {
      const { productId, quantity } = req.body;

      if (!productId || !quantity || quantity <= 0) {
        return res.status(400).json({ message: "Invalid data" });
      }

      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      let cart = await Cart.findOne({
        vendor: req.user.id,
        status: "active"
      });

      if (!cart) {
        cart = await Cart.create({
          vendor: req.user.id,
          items: []
        });
      }

      const itemIndex = cart.items.findIndex(
        i => i.product.toString() === productId
      );

      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += quantity;
      } else {
        cart.items.push({ product: productId, quantity });
      }

      await cart.save();
      res.json(cart);

    } catch (err) {
      console.error("CART ADD ERROR:", err);
      res.status(500).json({ message: "Add to cart failed" });
    }
  }
);

/* ================= GET CART ================= */
<<<<<<< HEAD
// GET /: Returns the signed-in vendor active cart with product details populated.
=======
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
router.get(
  "/",
  authMiddleware,
  approvedVendorOnly,
  async (req, res) => {
    let cart = await Cart.findOne({
      vendor: req.user.id,
      status: "active"
    }).populate("items.product");

    if (!cart) {
      return res.json({ items: [] });
    }

    const validItems = cart.items.filter(item => item.product);

    if (validItems.length !== cart.items.length) {
      cart.items = validItems;
      await cart.save();
    }
    res.json(cart);
  }
);

/* ================= REMOVE ITEM ================= */
<<<<<<< HEAD
// DELETE /remove/:productId: Removes one product from the signed-in vendor active cart.
=======
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
router.delete(
  "/remove/:productId",
  authMiddleware,
  approvedVendorOnly,
  async (req, res) => {
    const cart = await Cart.findOne({
      vendor: req.user.id,
      status: "active"
    });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.items = cart.items.filter(
      i => i.product.toString() !== req.params.productId
    );

    await cart.save();
    res.json(cart);
  }
);

/* ================= QUANTITY CHANGE ================= */

<<<<<<< HEAD
// PUT /update/:productId: Changes the quantity of one product already in the active cart.
=======
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
router.put(
  "/update/:productId",
  authMiddleware,
  approvedVendorOnly,
  async (req, res) => {
    try {
      const { quantity } = req.body;
      const { productId } = req.params;

      if (!quantity || quantity < 1) {
        return res.status(400).json({ message: "Invalid quantity" });
      }

      const cart = await Cart.findOne({
        vendor: req.user.id,
        status: "active"
      }).populate("items.product");

      if (!cart) {
        return res.status(404).json({ message: "Cart not found" });
      }

      const item = cart.items.find(
        i => i.product._id.toString() === productId
      );

      if (!item) {
        return res.status(404).json({ message: "Item not in cart" });
      }

      item.quantity = quantity;

      await cart.save();

      res.json({ message: "Qty updated", cart });
    } catch (err) {
      console.log("UPDATE QTY ERROR:", err);
      res.status(500).json({ message: "Update failed" });
    }
  });

// // FOR ADDRESSES 

// router.get("/vendor/addresses", authMiddleware, async (req,res)=>{
//   const vendor = await Vendor.findById(req.user.id);
//   res.json(vendor.addresses || []);
// });

// // ADD ADDRESSES
// router.post("/vendor/addresses", authMiddleware, async (req,res)=>{
//   const vendor = await Vendor.findById(req.user.id);

//   const newAddress = req.body;

//   if(newAddress.isDefault){
//     vendor.addresses.forEach(a => a.isDefault = false);
//   }

//   vendor.addresses.push(newAddress);
//   await vendor.save();

//   res.json(vendor.addresses);
// });

// //DELETE ADDRESSES
// router.delete("/vendor/addresses/:index", authMiddleware, async (req,res)=>{
//   const vendor = await Vendor.findById(req.user.id);

//   vendor.addresses.splice(req.params.index,1);
//   await vendor.save();

//   res.json(vendor.addresses);
// });

// // SET DEFAULT
// router.put("/vendor/addresses/default/:index", authMiddleware, async (req,res)=>{
//   const vendor = await Vendor.findById(req.user.id);

//   vendor.addresses.forEach(a => a.isDefault = false);
//   vendor.addresses[req.params.index].isDefault = true;

//   await vendor.save();

//   res.json(vendor.addresses);
// });

module.exports = router;