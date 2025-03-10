const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");
const sendToken = require("../utils/sendToken");
const cloudinary = require("cloudinary");

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
    folder: "avatars",
    width: 150,
    crop: "scale",
  });

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("All fields are mandatory.");
  }
  let user = await User.findOne({ email });
  if (user) {
    res.status(400);
    throw new Error("User already exists.");
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  user = await User.create({
    name,
    email,
    password: hashedPassword,
    avatar: {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    },
  });
  if (user) {
    const token = user.getJWTToken();
    req.user = user._id;
    req.token = token;
    sendToken(user, 201, res);
  } else {
    res.status(400);
    throw new Error("User data is not valid.");
  }
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error("All fields are mandatory.");
  }
  const user = await User.findOne({ email });
  if (user && (await bcrypt.compare(password, user.password))) {
    const accessToken = user.getJWTToken();
    sendToken(user, 200, res);
  } else {
    res.status(401);
    throw new Error("Invalid email or password.");
  }
});

const logoutUser = asyncHandler(async (req, res) => {
  res
    .cookie("token", "", {
      expires: new Date(Date.now()),
      sameSite: "none",
      secure: true,
    })
    .json({
      success: true,
      message: "User Logged out.",
    });
});

const getUser = asyncHandler(async (req, res) => {
  let user = req.user;
  let token = req.token;
  res.json({ user, token });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    res.status(404);
    throw new Error("User not found.");
  }
  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetPasswordUrl = `${process.env.FRONTEND_URL}/password/reset/${resetToken}`;
  const message = `Your password reset token is :- \n ${resetPasswordUrl} \n If you have not requested this email then, please ignore it.`;
  try {
    await sendEmail({
      email: user.email,
      subject: "E-commerce Password Recovery",
      message,
    });
    res.status(200).json({
      success: true,
      message: `Email send to ${user.email} successfully.`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    res.status(400);
    throw new Error(error.message);
  }
});

const resetPassword = asyncHandler(async (req, res) => {
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });
  if (!user) {
    res.status(404);
    throw new Error("Reset Password Token is invalid or has been expired.");
  }

  if (req.body.password !== req.body.confirmPassword) {
    res.status(400);
    throw new Error("Password does not match.");
  }

  user.password = await bcrypt.hash(req.body.password, 10);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();
  sendToken(user, 200, res);
});

const updatePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const isPasswordMatched = await bcrypt.compare(
    req.body.oldPassword,
    user.password
  );
  if (!isPasswordMatched) {
    res.status(401);
    throw new Error("Old password is incorrect.");
  }
  if (req.body.newPassword !== req.body.confirmPassword) {
    res.status(400);
    throw new Error("Password does not match.");
  }

  user.password = await bcrypt.hash(req.body.newPassword, 10);
  await user.save();
  sendToken(user, 200, res);
});

const updateProfile = asyncHandler(async (req, res) => {
  const newData = {
    name: req.body.name,
    email: req.body.email,
  };
  if (req.body.avatar !== "undefined") {
    const user = await User.findById(req.user.id);

    const imageId = user.avatar.public_id;

    await cloudinary.v2.uploader.destroy(imageId);

    const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
      folder: "avatars",
      width: 150,
      crop: "scale",
    });

    newData.avatar = {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    };
  }
  await User.findByIdAndUpdate(req.user._id, newData, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
  });
});

const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find();
  res.status(200).json({ success: true, users });
});

const getSingleUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User does not exist.");
  }
  res.status(200).json({ success: true, user });
});

const updateUserRole = asyncHandler(async (req, res) => {
  const newData = {
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
  };
  let user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error("User does not exist.");
  }

  user = await User.findByIdAndUpdate(req.params.id, newData, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
  });
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User does not exist.");
  }

  const imageId = user.avatar.public_id;
  await cloudinary.v2.uploader.destroy(imageId);

  await User.findByIdAndDelete(req.params.id);
  res.status(200).json({
    success: true,
    message: "User deleted successfully.",
  });
});

module.exports = {
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
};
