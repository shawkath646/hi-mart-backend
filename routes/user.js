const express = require("express");
const router = express.Router();
const { db } = require("../libs/firebase");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { isAuthenticated } = require("../libs/auth");
const { uploadFile } = require("../libs/utils");

const SECRET_KEY = process.env.SECRET_KEY;
if (!SECRET_KEY) throw new Error("SECRET_KEY is required");

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 24 * 60 * 60 * 1000,
};

router.post("/create-user", async (req, res) => {
    const { email, password, firstName, lastName, dateOfBirth, picture } = req.body;
    if (!email || !password || !firstName || !lastName || !dateOfBirth || !picture) return res.status(400).json({ error: "Missing required fields" });

    const querySnapshot = await db.collection("users").where("email", "==", email).get();
    if (!querySnapshot.empty) return res.status(409).json({ error: "User already exists" });

    const userRef = db.collection("users").doc();

    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = {
        id: userRef.id,
        firstName,
        lastName,
        dateOfBirth: new Date(dateOfBirth),
        email,
        picture: await uploadFile(picture, `profile_${userRef.id}`),
        password: hashedPassword,
        joinedOn: new Date(),
    };

    await userRef.set(newUser);
    return res.json({ message: "User created", userId: userRef.id });
});

router.post("/signin", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Missing required fields" });

    const querySnapshot = await db.collection("users").where("email", "==", email).get();
    if (querySnapshot.empty) return res.status(404).json({ error: "User not found" });

    const userDoc = querySnapshot.docs[0];
    const user = userDoc.data();
    const isValidPassword = bcrypt.compareSync(password, user.password);
    if (!isValidPassword) return res.status(401).json({ error: "Invalid password" });

    const cookieObject = {
        userId: userDoc.id,
        email: user.email,
    };

    const token = jwt.sign(cookieObject, SECRET_KEY, { expiresIn: "1d" });

    res.cookie("auth_token", token, COOKIE_OPTIONS);
    return res.json({ message: "Login successful" });
});

router.get("/get-session", isAuthenticated, async (req, res) => {
    return res.json(req.user);
});

module.exports = router;