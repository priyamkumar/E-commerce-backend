const express = require("express");
const {
  allProducts,
  singleProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductReview,
  getProductReviews,
  deleteProductReview,
  adminProducts,
} = require("../controllers/productController");
const { authorizeRoles, isAuthenticated } = require("../middleware/auth");
const router = express.Router();

router.get("/products", allProducts);

router.get(
  "/admin/products",
  isAuthenticated,
  authorizeRoles("admin"),
  adminProducts
);

router.post(
  "/admin/create",
  isAuthenticated,
  authorizeRoles("admin"),
  createProduct
);
router
  .route("/admin/:id")
  .put(isAuthenticated, authorizeRoles("admin"), updateProduct)
  .delete(isAuthenticated, authorizeRoles("admin"), deleteProduct);
router.get("/details/:id", singleProduct);
router.put("/review", isAuthenticated, createProductReview);
router
  .route("/reviews")
  .get(getProductReviews)
  .delete(isAuthenticated, deleteProductReview);

module.exports = router;
