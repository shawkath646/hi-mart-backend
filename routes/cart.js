const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../libs/auth");
const { db } = require("../libs/firebase");

router.get("/count", isAuthenticated, async (req, res) => {
  try {
    const cartSnapshot = await db.collection("users").doc(req.user.userId).collection("cart").get();
    return res.status(200).json({ count: cartSnapshot.size });
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch cart count" });
  }
});

router.get("/", isAuthenticated, async (req, res) => {
  try {
    const cartSnapshot = await db
      .collection("users")
      .doc(req.user.userId)
      .collection("cart")
      .get();

    const cartItems = await Promise.all(
      cartSnapshot.docs.map(async (doc) => {
        const { productId, quantity } = doc.data();
        const productDoc = await db.collection("products").doc(productId).get();

        if (!productDoc.exists) return null;

        const productData = productDoc.data();

        return {
          id: productId,
          title: productData.title,
          image: productData.image,
          price: productData.discountPrice || productData.price,
          quantity,
          stock: productData.stock,
        };
      })
    );

    const filteredItems = cartItems.filter((item) => item !== null);

    return res.status(200).json(filteredItems);
  } catch (error) {
    return res.status(500).json({ error: "Error fetching cart items" });
  }
});

router.post("/", isAuthenticated, async (req, res) => {
  const { productId, quantity = 1 } = req.body;

  if (!productId || typeof quantity !== "number" || quantity <= 0) {
    return res.status(400).json({ error: "Invalid product ID or quantity" });
  }

  try {
    const userCartRef = db
      .collection("users")
      .doc(req.user.userId)
      .collection("cart")
      .doc(productId);

    const cartItemSnap = await userCartRef.get();

    if (cartItemSnap.exists) {
      const existingQty = cartItemSnap.data().quantity || 0;
      await userCartRef.update({ quantity: existingQty + quantity });
    } else {
      await userCartRef.set({ productId, quantity });
    }

    return res.status(200).json({ message: "Product added to cart" });
  } catch (error) {
    return res.status(500).json({ error: "Failed to add product to cart" });
  }
});

router.put("/", isAuthenticated, async (req, res) => {
  const { productId, quantity } = req.body;

  if (!productId || !quantity || quantity < 1) {
    return res.status(400).json({ error: "Invalid product id or quantity" });
  }

  try {
    const userId = req.user.userId;

    const cartItemRef = db.collection("users").doc(userId).collection("cart").doc(productId);
    const cartItemSnap = await cartItemRef.get();

    if (!cartItemSnap.exists) {
      return res.status(404).json({ error: "Product not found in cart" });
    }

    await cartItemRef.update({ quantity });

    const updatedItem = (await cartItemRef.get()).data();

    return res.status(200).json({ id: productId, ...updatedItem });
  } catch (error) {
    return res.status(500).json({ error: "Failed to update cart item" });
  }
});

router.delete("/", isAuthenticated, async (req, res) => {
  const { productId } = req.body;

  if (!productId) {
    return res.status(400).json({ error: "Product ID is required" });
  }

  try {
    const userId = req.user.userId;

    const cartItemRef = db.collection("users").doc(userId).collection("cart").doc(productId);
    const cartItemSnap = await cartItemRef.get();

    if (!cartItemSnap.exists) {
      return res.status(404).json({ error: "Product not found in cart" });
    }

    await cartItemRef.delete();

    // Verify deletion
    const verifySnap = await cartItemRef.get();
    if (verifySnap.exists) {
      return res.status(500).json({ error: "Failed to delete item from database" });
    }

    return res.status(200).json({ message: "Product removed from cart", id: productId });
  } catch (error) {
    console.error("Delete cart item error:", error);
    return res.status(500).json({ error: "Failed to remove product from cart" });
  }
});

// Sync guest cart with user cart after login
router.post("/sync", isAuthenticated, async (req, res) => {
  const { guestCart } = req.body;

  if (!Array.isArray(guestCart)) {
    return res.status(400).json({ error: "Invalid guest cart format" });
  }

  try {
    const userId = req.user.userId;
    const userCartRef = db.collection("users").doc(userId).collection("cart");
    
    let synced = 0;
    let errors = 0;

    // Process each guest cart item
    for (const item of guestCart) {
      if (!item.productId || !item.quantity || item.quantity < 1) {
        errors++;
        continue;
      }

      try {
        // Check if product exists in database
        const productDoc = await db.collection("products").doc(item.productId).get();
        if (!productDoc.exists) {
          errors++;
          continue;
        }

        const cartItemRef = userCartRef.doc(item.productId);
        const cartItemSnap = await cartItemRef.get();

        if (cartItemSnap.exists) {
          // Merge quantities if item already exists in user cart
          const existingQty = cartItemSnap.data().quantity || 0;
          await cartItemRef.update({ 
            quantity: existingQty + item.quantity 
          });
        } else {
          // Add new item to user cart
          await cartItemRef.set({ 
            productId: item.productId, 
            quantity: item.quantity 
          });
        }
        synced++;
      } catch (itemError) {
        errors++;
        console.error(`Error syncing item ${item.productId}:`, itemError);
      }
    }

    return res.status(200).json({ 
      message: "Cart synced successfully",
      synced,
      errors
    });
  } catch (error) {
    console.error("Cart sync error:", error);
    return res.status(500).json({ error: "Failed to sync cart" });
  }
});

module.exports = router;