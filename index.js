const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config({ path: __dirname + "/.env.local" });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
    res.send("Hello, Himart Backend is Running!");
});

app.use("/user", require("./routes/user"));
app.use("/get-all-products", require("./routes/get-all-products"));
app.use("/product", require("./routes/product"));

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
