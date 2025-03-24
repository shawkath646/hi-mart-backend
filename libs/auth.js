const { db } = require("../libs/firebase");
const jwt = require("jsonwebtoken");

const SECRET_KEY = process.env.SECRET_KEY;
if (!SECRET_KEY) throw new Error("SECRET_KEY is required");

const isAuthenticated = async (req, res, next) => {
    const authToken = req.cookies.auth_token;
    if (!authToken) return res.status(403).json({ error: "Unauthorized" });

    try {
        const decoded = jwt.verify(authToken, SECRET_KEY);
        const userDoc = await db.collection("users").doc(decoded.userId).get();
        if (!userDoc.exists) return res.status(404).json({ error: "User not found" });
        const user = userDoc.data();
        user.password = undefined;
        req.user = user;
        next();
    } catch (err) {
        res.status(401).json({ error: "Invalid token" });
    };
};

module.exports = { isAuthenticated };