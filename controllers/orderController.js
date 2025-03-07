const asyncHandler = require("express-async-handler");
const Order = require("../models/orderModel");
const Product = require("../models/productModel");

const newOrder = asyncHandler(async (req, res) => {
  const {
    shippingInfo,
    orderItems,
    paymentInfo,
    itemsPrice,
    texPrice,
    shippingPrice,
    totalPrice,
  } = req.body;

  const order = await Order.create({
    shippingInfo,
    orderItems,
    paymentInfo,
    itemsPrice,
    texPrice,
    shippingPrice,
    totalPrice,
    user: req.user._id,
    paidAt: Date.now(),
  });

  res.status(201).json({
    success: true,
    order,
  });
});

const getSingleOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate(
    "user",
    "name email"
  );

  if (!order) {
    res.status(404);
    throw new Error("Order not found.");
  }
  res.status(200).json({
    success: true,
    order,
  });
});

const myOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id });

  if (!orders) {
    res.status(404);
    throw new Error("No Order found.");
  }
  res.status(200).json({
    success: true,
    orders,
  });
});

const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find();
  let totalAmount = orders.reduce((acc, cur) => acc + cur.totalPrice, 0);
  if (!orders) {
    res.status(404);
    throw new Error("Order not found.");
  }
  res.status(200).json({
    success: true,
    totalAmount,
    orders,
  });
});

const updateOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error("Order not found.");
  }
  if (order.status === "Delivered") {
    res.status(400);
    throw new Error("You have already delivered this order.");
  }

  if(req.body.status === "Shipped")
  order.orderItems.forEach(async (order) => {
    await updateStock(order.product, order.quantity);
  });

  order.status = req.body.status;

  if (req.body.status === "Delivered") {
    order.deliveredAt = Date.now();
  }
  await order.save({ validateBeforeSave: false });
  res.status(200).json({
    success: true,
  });
});

async function updateStock(id, quantity) {
  const product = await Product.findById(id);
  product.stock = product.stock - quantity;
  await product.save({ validateBeforeSave: false });
}

const deleteOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error("Order not found.");
  }
  await Order.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
  });
});


module.exports = {
  newOrder,
  getSingleOrder,
  myOrders,
  getAllOrders,
  updateOrder,
  deleteOrder
};
