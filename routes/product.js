const express = require("express");
const router = express.Router();
const { db, bucket } = require("../libs/firebase");
const { isAuthenticated, optionalAuthentication } = require("../libs/auth");
const { getProductAdditionalData, addClick } = require("../libs/helper");
const { uploadFile } = require("../libs/utils");

router.route("/")
    .get(optionalAuthentication, async (req, res) => {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: "Product ID is required" });

        try {
            const productRef = db.collection("products").doc(id);
            const product = await productRef.get();

            if (!product.exists) return res.status(404).json({ error: "Product not found" });
            const productData = product.data();
            const additionalData = await getProductAdditionalData(id, productData.sellerId);
            if (req.user && req.user.userId) {
                await addClick(id, req.user.userId);
            }

            return res.json({...productData, ...additionalData });
        } catch (error) {
            return res.status(500).json({ error: "Error fetching product" });
        }
    })
    .post(isAuthenticated, async (req, res) => {
        const requiredFields = ['title', 'description', 'brandName', 'image', 'price', 'category', 'stock' ];
        const missingField = requiredFields.find(field => !req.body[field]);
        if (missingField) return res.status(400).json({ error: `Missing ${missingField}` });

        const price = parseFloat(req.body.price);
        const discountPrice = req.body.discountPrice ? parseFloat(req.body.discountPrice) : null;
        const stock = parseInt(req.body.stock);

        if (isNaN(price) || price < 0) {
            return res.status(400).json({ error: "Invalid price value" });
        }
        if (discountPrice !== null && (isNaN(discountPrice) || discountPrice < 0 || discountPrice >= price)) {
            return res.status(400).json({ error: "Invalid discount price" });
        }
        if (isNaN(stock) || stock < 0) {
            return res.status(400).json({ error: "Invalid stock value" });
        }

        try {
        const newProductRef = db.collection("products").doc();

        const newProduct = {
            id: newProductRef.id,
            title: req.body.title,
            description: req.body.description,
            price,
            discountPrice,
            image: await uploadFile(req.body.image, `product_${newProductRef.id}`),
            stock,
            brandName: req.body.brandName,
            category: req.body.category,
            sellerId: req.user.userId,
            timestamp: new Date(),
            keywords: req.body.keywords || [],
        };

        await newProductRef.set(newProduct);
        return res.status(201).json({ message: "Product created" });
        } catch (error) {
            return res.status(500).json({ error: "Failed to create product" });
        }
    })
    .put(isAuthenticated, async (req, res) => {
        try {
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
        } catch (error) {
            return res.status(500).json({ error: "Failed to update product" });
        }
    })
    .delete(isAuthenticated, async (req, res) => {
        try {
        const { id } = req.body;
        if (!id) return res.status(400).json({ error: "Product ID is required" });

        const productRef = db.collection("products").doc(id);
        const product = await productRef.get();

        if (!product.exists) return res.status(404).json({ error: "Product not found" });

        if (product.data().sellerId !== req.user.id)
            return res.status(403).json({ error: "Unauthorized" });

        const fileRef = bucket.file(`product_${id}`);
        if (await fileRef.exists()) await fileRef.delete();
        await productRef.delete();
        return res.json({ message: "Product deleted" });
        } catch (error) {
            return res.status(500).json({ error: "Failed to delete product" });
        }
    });

module.exports = router;