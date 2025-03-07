const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const isAuthenticated = asyncHandler(async (req, res, next) => {
  const { token } = req.cookies;
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Login first",
    });
  }
  const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  req.user = await User.findById(decoded.userId);
  req.token = token;
  next();
});

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.json({
        success: false,
        message: `Role: ${req.user.role} is not allowed to access this resource`,
      });
    }
    next();
  };
};

module.exports = { isAuthenticated, authorizeRoles };
