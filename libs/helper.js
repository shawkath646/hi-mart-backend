const { db } = require("../libs/firebase");

const getProductAdditionalData = async (productId, sellerId) => {
    try {
        const sellerDoc = await db.collection('sellers').doc(sellerId).get();
        const productDocRef = db.collection('products').doc(productId);

        const [clickedBySnapshot, ratedBySnapshot, totalSoldSnapshot, totalImpressions] = await Promise.all([
            productDocRef.collection("clickedBy").get(),
            productDocRef.collection("ratedBy").get(),
            productDocRef.collection("sold").get(),
            productDocRef.collection("impressions").get()
        ]);

        return {
            sellerName: sellerDoc.exists ? sellerDoc.data().businessName : 'Unknown Seller',
            totalClicks: clickedBySnapshot.size,
            totalRatings: ratedBySnapshot.size,
            totalSold: totalSoldSnapshot.size,
            totalImpressions: totalImpressions.size
        };
    } catch (error) {
        console.error('Error fetching product additional data:', error);
        return {
            sellerName: 'Unknown',
            totalClicks: 0,
            totalRatings: 0,
            totalSold: 0,
            totalImpressions: 0
        };
    }
};

const addImpression = async (productId, userId) => {
    try {
        const productRef = db.collection('products').doc(productId);
        const impressionRef = productRef.collection('impressions').doc(userId);

        const impressionDoc = await impressionRef.get();
        if (!impressionDoc.exists) {
            await impressionRef.set({ timestamp: new Date() });
        }
    } catch (error) {
        console.error('Error adding impression:', error);
    }
};

const addClick = async (productId, userId) => {
    try {
        const productRef = db.collection('products').doc(productId);
        const clickRef = productRef.collection('clickedBy').doc(userId);

        const clickDoc = await clickRef.get();
        if (!clickDoc.exists) {
            await clickRef.set({ timestamp: new Date() });
        }
    } catch (error) {
        console.error('Error adding click:', error);
    }
};

module.exports = {
    getProductAdditionalData,
    addImpression,
    addClick
};
