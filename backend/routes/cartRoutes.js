const express = require("express");
const router = express.Router();

const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Vendor = require("../models/Vendor");
const authMiddleware = require("../middleware/authMiddleware");
const approvedVendorOnly = require("../middleware/approveVendorOnly");

/* ================= ADD TO CART ================= */
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

router.put("/update/:productId", auth, async (req, res) => {
  const { quantity } = req.body;

  if (quantity < 1) {
    return res.status(400).json({ message: "Invalid quantity" });
  }

  const cart = await Cart.findOne({ user: req.user.id });

  const item = cart.items.find(i =>
    i.product.toString() === req.params.productId
  );

  if (!item) return res.status(404).json({ message: "Item not found" });

  item.quantity = quantity;
  await cart.save();

  res.json({ message: "Cart updated" });
});

module.exports = router;