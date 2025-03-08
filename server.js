const express = require("express");
const dotenv = require("dotenv");
const connectDb = require("./utils/connectDb");
const cookieParser = require("cookie-parser");
const errorHandler = require("./middleware/errorHandler");
const cloudinary = require("cloudinary");
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");

dotenv.config();
console.log(process.env)

const PORT = process.env.PORT || 5000;
connectDb();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload());

app.get("/", (req, res) => {
  res.send("Working");
});
app.use("/api/v1/user", require("./routes/userRoutes"));
app.use("/api/v1/product", require("./routes/productRoutes"));
app.use("/api/v1/orders", require("./routes/orderRoutes"));
app.use("/api/v1/payment", require("./routes/paymentRoutes"));
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server started on PORT ${PORT}`);
});
