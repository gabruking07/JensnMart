const mongoose = require("mongoose");
const Order = require("./models/Order");

mongoose.connect("mongodb://127.0.0.1:27017/jensnmart");

async function run() {
  const orders = await Order.find().sort({ createdAt: 1 });

  for (let i = 0; i < orders.length; i++) {
    orders[i].orderNumber = i + 1;
    await orders[i].save();
  }

  console.log("Fixed order numbers");
  process.exit();
}

run();