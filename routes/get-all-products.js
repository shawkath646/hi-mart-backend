const express = require('express');
const router = express.Router();
const { db } = require('../libs/firebase');

async function fetchProducts(query, limit, page) {
    const productsRef = db.collection('products');
    let queryRef = productsRef;

    if (query.category) {
        queryRef = queryRef.where('category', '==', query.category);
    }

    const offset = (page - 1) * limit;
    const snapshot = await queryRef.offset(offset).limit(limit).get();

    return snapshot.docs.map(doc => doc.data());
}

router.get('/', async (req, res) => {
    const { category, limit = 10, page = 1 } = req.query;

    try {
        const products = await fetchProducts({ category }, parseInt(limit), parseInt(page));
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/trending', async (req, res) => {
    const { category, limit = 10, page = 1 } = req.query;

    try {
        const products = await fetchProducts({ category }, parseInt(limit), parseInt(page));
        const trending = products.sort((a, b) => (b.impressions + b.clicks) - (a.impressions + a.clicks));
        res.json(trending);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/latest', async (req, res) => {
    const { category, limit = 10, page = 1 } = req.query;

    try {
        const products = await fetchProducts({ category }, parseInt(limit), parseInt(page));
        const latest = products.sort((a, b) => b.createdAt - a.createdAt);
        res.json(latest);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// User choice products route
router.get('/user-choices', async (req, res) => {
    const { category, limit = 10, page = 1 } = req.query;
    const userPreferences = req.cookies.userPreferences || []; // Example: ['electronics', 'smartphone']

    try {
        const products = await fetchProducts({ category }, parseInt(limit), parseInt(page));
        const userChoices = products.filter(product =>
            userPreferences.some(pref => product.name.includes(pref) || product.category.includes(pref))
        );
        res.json(userChoices);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Discounted products route
router.get('/discounts', async (req, res) => {
    const { category, limit = 10, page = 1 } = req.query;

    try {
        const products = await fetchProducts({ category }, parseInt(limit), parseInt(page));
        const discounted = products.filter(product => product.discount > 0);
        res.json(discounted);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;