const asyncHandler = require("express-async-handler");
const Product = require("../models/productModel");
const ApiFeatures = require("../utils/apiFeatures");
const cloudinary = require("cloudinary");

const allProducts = asyncHandler(async (req, res) => {
  const resultPerPage = 4;
  const productCount = await Product.countDocuments();
  const apiFeatures = new ApiFeatures(Product.find(), req.query)
    .search()
    .filter();
  let products = await apiFeatures.query;
  let filteredProductsCount = products.length;
  apiFeatures.pagination(resultPerPage);
  products = await apiFeatures.query.clone();
  res.status(200).json({
    success: true,
    products,
    productCount,
    resultPerPage,
    filteredProductsCount,
  });
});

const adminProducts = asyncHandler(async (req, res) => {
  const products = await Product.find();
  res.status(200).json({
    success: true,
    products,
  });
});

const singleProduct = asyncHandler(async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }
    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    if (error.name === "CastError") {
      res.status(400);
      throw new Error("Invalid product ID");
    } else {
      throw error;
    }
  }
});

const createProduct = asyncHandler(async (req, res) => {
  try {
    let images = [];
    if (typeof req.body.images === "string") {
      images.push(req.body.images);
    } else {
      images = req.body.images;
    }
    const imagesLink = [];
    for (let i = 0; i < images.length; i++) {
      const result = await cloudinary.v2.uploader.upload(images[i], {
        folder: "products",
      });
      imagesLink.push({
        public_id: result.public_id,
        url: result.url,
      });
    }
    req.body.images = imagesLink;
    req.body.user = req.user._id;
    const product = await Product.create(req.body);
    res.status(201).json({
      success: true,
      product,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      res.status(400);
      throw new Error("Validation Error");
    } else {
      throw error;
    }
  }
});

const updateProduct = asyncHandler(async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }
    let images = [];
    if (typeof req.body.images === "string") {
      images.push(req.body.images);
    } else {
      images = req.body.images;
    }

    if (images !== undefined) {
      for (let i = 0; i < product.images.length; i++) {
        await cloudinary.v2.uploader.destroy(product.images[i].public_id);
      }
      const imagesLink = [];
      for (let i = 0; i < images.length; i++) {
        const result = await cloudinary.v2.uploader.upload(images[i], {
          folder: "products",
        });
        imagesLink.push({
          public_id: result.public_id,
          url: result.url,
        });
      }
      req.body.images = imagesLink;
    }
    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    if (error.name === "CastError") {
      res.status(400);
      throw new Error("Invalid product ID");
    } else if (error.name === "ValidationError") {
      res.status(400);
      throw new Error("Validation Error");
    } else {
      throw error;
    }
  }
});

const deleteProduct = asyncHandler(async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }
    for (let i = 0; i < product.images.length; i++) {
      await cloudinary.v2.uploader.destroy(product.images[i].public_id);
    }
    product = await Product.findByIdAndDelete(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: `Product deleted ${product}.`,
    });
  } catch (error) {
    if (error.name === "CastError") {
      res.status(400);
      throw new Error("Invalid product ID");
    } else {
      throw error;
    }
  }
});

const createProductReview = asyncHandler(async (req, res) => {
  const { rating, comment, productId } = req.body;
  const review = {
    user: req.user._id,
    name: req.user.name,
    rating: Number(rating),
    comment,
  };
  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  let isReviewed = product.reviews.find(
    (rev) => rev.user.toString() === req.user._id.toString()
  );
  if (isReviewed) {
    product.reviews.forEach((rev) => {
      if (rev.user.toString() === req.user._id.toString()) rev.rating = rating;
      rev.comment = comment;
    });
  } else {
    product.reviews.push(review);
    product.numOfReviews = product.reviews.length;
  }
  product.ratings =
    product.reviews.reduce((acc, cur) => acc + cur.rating, 0) /
    product.reviews.length;
  await product.save({
    validateBeforeSave: false,
  });
  res.status(200).json({
    success: true,
  });
});

const getProductReviews = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.query.id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  res.status(200).json({
    success: true,
    reviews: product.reviews,
  });
});

const deleteProductReview = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.query.productId);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  const reviews = product.reviews.filter(
    (rev) => rev._id.toString() !== req.query.id.toString()
  );
  let ratings = 0;

  numOfReviews = reviews.length;
  if (numOfReviews)
    ratings = reviews.reduce((acc, cur) => acc + cur.rating, 0) / numOfReviews;

  await Product.findByIdAndUpdate(
    req.query.productId,
    {
      reviews,
      ratings,
      numOfReviews,
    },
    {
      new: true,
      runValidators: true,
    }
  );
  res.status(200).json({
    success: true,
  });
});

module.exports = {
  allProducts,
  adminProducts,
  singleProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductReview,
  getProductReviews,
  deleteProductReview,
};
