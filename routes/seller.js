const express = require("express");
const router = express.Router();
const { db } = require("../libs/firebase");
const { isAuthenticated } = require("../libs/auth");

router.post("/register", isAuthenticated, async (req, res) => {

    const requiredFields = ['businessName', 'businessType', 'email', 'phone', 'address', 'taxId'];
    const missingField = requiredFields.find(field => !req.body[field]);
    if (missingField) return res.status(400).json({ error: `Missing ${missingField}` });

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.email)) {
        return res.status(400).json({ error: "Invalid email format" });
    }

    const docRef = db.collection("sellers").doc(req.user.userId);

    if ((await docRef.get()).exists) {
        return res.status(400).json({ error: "You are already registered as a seller." });
    }
    await docRef.set({
        businessName: req.body.businessName,
        businessType: req.body.businessType,
        businessLogo: '',
        email: req.body.email,
        phone: req.body.phone,
        address: req.body.address,
        taxId: req.body.taxId,
        createdAt: new Date().toISOString(),
        authorId: req.user.userId,
    });

    await db.collection("users").doc(req.user.userId).update({
        isSeller: true,
    });

    return res.status(201).json({ error: "Successfully registered as a seller." });
});

router.get("/session", isAuthenticated, async (req, res) => {
    const sellerDoc = await db.collection("sellers").doc(req.user.userId).get();
    if (!sellerDoc.exists) {
        return res.status(404).json({ error: "Seller not found" });
    }
    return res.json(sellerDoc.data());
});

router.get("/data", isAuthenticated, async(req, res) => {
    const sellerProducts = await db.collection("products").where("sellerId", "==", req.user.userId).get();
    const products = sellerProducts.docs.map(doc => ({ id: doc.id, ...doc.data() }));
});

module.exports = router; 