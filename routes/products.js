const express = require('express');
const router = express.Router();
const { db } = require('../libs/firebase');
const { addImpression, getProductAdditionalData } = require('../libs/helper');

async function fetchProducts(query, limit, page) {
    const productsRef = db.collection('products');
    let queryRef = productsRef;

    if (query.category) {
        queryRef = queryRef.where('category', '==', query.category);
    }

    const offset = (page - 1) * limit;
    const snapshot = await queryRef.offset(offset).limit(limit).get();

    const products = await Promise.all(
        snapshot.docs.map(async (doc) => {
            const data = doc.data();

            const additionalData = await getProductAdditionalData(doc.id, data.sellerId);
            await addImpression(doc.id, data.sellerId);

            return {
                ...data,
                ...additionalData, // includes sellerName, totalClicks, totalRatings, totalSold
                description:
                    data.description?.length > 150
                        ? data.description.slice(0, 147) + "..."
                        : data.description,
            };
        })
    );

    return products;
};

router.get('/', async (req, res) => {
    const { category, limit = 10, page = 1 } = req.query;

    try {
        const products = await fetchProducts({ category }, parseInt(limit), parseInt(page));
        return res.json(products);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

router.get('/trending', async (req, res) => {
    const { category, limit = 10, page = 1 } = req.query;

    try {
        const products = await fetchProducts({ category }, parseInt(limit), parseInt(page));
        const trending = products.sort((a, b) => (b.totalImpressions + b.totalClicks) - (a.totalImpressions + a.totalClicks));
        return res.json(trending);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

router.get('/latest', async (req, res) => {
    const { category, limit = 10, page = 1 } = req.query;

    try {
        const products = await fetchProducts({ category }, parseInt(limit), parseInt(page));
        const latest = products.sort((a, b) => {
            const aDate = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt).getTime();
            const bDate = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt).getTime();
            return bDate - aDate;
        });

        return res.json(latest);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

router.get('/user-choices', async (req, res) => {
    const { category, limit = 10, page = 1 } = req.query;
    const userPreferences = req.cookies.userPreferences || [];

    try {
        const products = await fetchProducts({ category }, parseInt(limit), parseInt(page));
        const userChoices = products.filter(product =>
            userPreferences.some(pref => product.name.includes(pref) || product.category.includes(pref))
        );
        return res.json(userChoices);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

// Discounted products route
router.get('/discounts', async (req, res) => {
    const { category, limit = 10, page = 1 } = req.query;

    try {
        const products = await fetchProducts({ category }, parseInt(limit), parseInt(page));
        const discounted = products.filter(product => product.discountPrice > 0);
        return res.json(discounted);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

router.get("/minisearch", async (req, res) => {
    const query = req.query.q?.toLowerCase();

    if (!query || query.length < 3) {
        return res.status(400).json({ error: "Query must be at least 3 characters long" });
    }

    try {
        const snapshot = await db.collection("products").limit(100).get(); // fetch a reasonable batch
        const results = [];

        snapshot.forEach((doc) => {
            const data = doc.data();
            const title = data.title?.toLowerCase() || "";
            const brand = data.brandName?.toLowerCase() || "";
            const keywords = data.keywords?.map(k => k.toLowerCase()) || [];

            let score = 0;

            if (title.includes(query)) score += 3;
            if (brand.includes(query)) score += 2;
            if (keywords.some(k => k.includes(query))) score += 1;

            if (score > 0) {
                results.push({
                    id: doc.id,
                    title: data.title,
                    image: data.image,
                    score,
                });
            }
        });

        // Sort by score (descending), and return top 5
        const sorted = results
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
            .map(({ id, title, image }) => ({ id, title, image }));

        return res.json(sorted);
    } catch (error) {
        console.error("Mini search error:", error);
        return res.status(500).json({ error: error.message });
    }
});

module.exports = router;