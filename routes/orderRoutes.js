const express = require("express");
const { isAuthenticated, authorizeRoles } = require("../middleware/auth");
const {
  newOrder,
  getSingleOrder,
  myOrders,
  getAllOrders,
  updateOrder,
  deleteOrder,
} = require("../controllers/orderController");
const router = express.Router();

router.post("/new", isAuthenticated, newOrder);
router.get("/details/:id", isAuthenticated, getSingleOrder);
router.get("/myOrders", isAuthenticated, myOrders);
router.get(
  "/allOrders",
  isAuthenticated,
  authorizeRoles("admin"),
  getAllOrders
);
router
  .route("/order/:id")
  .put(isAuthenticated, authorizeRoles("admin"), updateOrder)
  .delete(isAuthenticated, authorizeRoles("admin"), deleteOrder);

module.exports = router;
