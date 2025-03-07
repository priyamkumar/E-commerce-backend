const express = require("express");
const {
  registerUser,
  loginUser,
  logoutUser,
  getUser,
  forgotPassword,
  resetPassword,
  updatePassword,
  updateProfile,
  getAllUsers,
  getSingleUser,
  updateUserRole,
  deleteUser,
} = require("../controllers/userController");
const { isAuthenticated, authorizeRoles } = require("../middleware/auth");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/", isAuthenticated, getUser);
router.get("/logout", isAuthenticated, logoutUser);
router.post("/password/forgot", forgotPassword);
router.put("/password/update", isAuthenticated, updatePassword);
router.put("/password/reset/:token", resetPassword);
router.put("/update", isAuthenticated, updateProfile);
router.get(
  "/getAllUsers",
  isAuthenticated,
  authorizeRoles("admin"),
  getAllUsers
);
router
  .route("/admin/user/:id")
  .get(isAuthenticated, authorizeRoles("admin"), getSingleUser)
  .put(isAuthenticated, authorizeRoles("admin"), updateUserRole)
  .delete(isAuthenticated, authorizeRoles("admin"), deleteUser);
module.exports = router;
