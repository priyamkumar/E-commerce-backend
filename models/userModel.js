const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const validator = require("validator");
const crypto = require("crypto");

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Username is required"],
      minLength: [4, "Name should have more than 4 characters"],
      maxLength: [25, "Name should have less than 25 characters"],
    },
    email: {
      type: String,
      required: [true, "User email is required"],
      validate: [validator.isEmail, "Please enter a valid Email"],
    },
    password: {
      type: String,
      required: [true, "User password is required"],
    },
    avatar: {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
    role: {
      type: String,
      default: "user",
    },

    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true,
  }
);

userSchema.methods.getJWTToken = function () {
  return jwt.sign({ userId: this._id }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: 15 * 60,
  });
};

userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
  return resetToken;
};

module.exports = mongoose.model("User", userSchema);
