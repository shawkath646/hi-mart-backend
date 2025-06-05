const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config({ path: __dirname + "/.env.local" });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Hello, Himart Backend is Running!");
});

app.use("/auth", require("./routes/user"));
app.use("/products", require("./routes/products"));
app.use("/product", require("./routes/product"));
app.use("/seller", require("./routes/seller"));
app.use("/cart", require("./routes/cart"));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
