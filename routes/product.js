const express = require("express");
const router = express.Router();
const { db, bucket } = require("../libs/firebase");
const { isAuthenticated } = require("../libs/auth");
const { uploadFile } = require("../libs/utils");

router.route("/")
    .get(async (req, res) => {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: "Product ID is required" });

        try {
            const productRef = db.collection("products").doc(id);
            const product = await productRef.get();

            if (!product.exists) return res.status(404).json({ error: "Product not found" });

            res.json(product.data());
        } catch (error) {
            res.status(500).json({ error: "Error fetching product" });
        }
    })
    .post(isAuthenticated, async (req, res) => {
        const { title, description, price, discountPrice, thumbnail, category } = req.body;

        if (!title || !description || !price || !thumbnail || !category)
            return res.status(400).json({ error: "Missing required fields" });

        const newProductRef = db.collection("products").doc();

        const newProduct = {
            id: newProductRef.id,
            title,
            description,
            price: parseFloat(price),
            discountPrice: discountPrice ? parseFloat(discountPrice) : null,
            thumbnail: await uploadFile(thumbnail, `product_${newProductRef.id}`),
            outOfStock: false,
            category,
            sellerId: req.user.id,
            timestamp: new Date(),
            impressions: 0,
            purchasedBy: [],
            ratedBy: [],
        };

        await newProductRef.set(newProduct);
        return res.json({ message: "Product created" });
    })
    .put(isAuthenticated, async (req, res) => {
        const { id, title, description, price, discountPrice, outOfStock, thumbnail } = req.body;

        if (!id || !title || !description || !price || !thumbnail)
            return res.status(400).json({ error: "Missing required fields" });

        const productRef = db.collection("products").doc(id);
        const product = await productRef.get();

        if (!product.exists) return res.status(404).json({ error: "Product not found" });
        const existingData = product.data();

        if (existingData.sellerId !== req.user.id)
            return res.status(403).json({ error: "Unauthorized" });

        const updatedProduct = {
            ...existingData,
            title,
            description,
            price: parseFloat(price),
            discountPrice: discountPrice ? parseFloat(discountPrice) : null,
            thumbnail: await uploadFile(thumbnail, `product_${id}`),
            outOfStock: outOfStock || false,
        };

        await productRef.update(updatedProduct);
        return res.json({ message: "Product updated" });
    })
    .delete(isAuthenticated, async (req, res) => {
        const { id } = req.body;
        if (!id) return res.status(400).json({ error: "Product ID is required" });

        const productRef = db.collection("products").doc(id);
        const product = await productRef.get();

        if (!product.exists) return res.status(404).json({ error: "Product not found" });

        if (product.data().sellerId !== req.user.id)
            return res.status(403).json({ error: "Unauthorized" });

        const fileRef = bucket.file(`product_pRlUCqsXqYEhLnFFYvZU`);
        if (await fileRef.exists()) await fileRef.delete();
        await productRef.delete();
        return res.json({ message: "Product deleted" });
    });

module.exports = router;