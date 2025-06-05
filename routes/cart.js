const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../libs/auth");
const { db } = require("../libs/firebase");

router.get("/count", isAuthenticated, async (req, res) => {
  const cartSnapdhot = await db.collection("users").doc(req.user.userId).collection("cart").get();
  return res.status(200).json({ count: cartSnapdhot.size });
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
    console.error("Error fetching cart items:", error);
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
    console.error("Error adding to cart:", error);
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
    console.error("Error updating cart item:", error);
    return res.status(500).json({ error: "Failed to update cart item" });
  }
});

router.delete("/", isAuthenticated, async (req, res) => {
  const { productId } = req.body;

  try {
    const userId = req.user.userId;

    const cartItemRef = db.collection("users").doc(userId).collection("cart").doc(productId);
    const cartItemSnap = await cartItemRef.get();

    if (!cartItemSnap.exists) {
      return res.status(404).json({ error: "Product not found in cart" });
    }

    await cartItemRef.delete();

    return res.status(200).json({ message: "Product removed from cart", id: productId });
  } catch (error) {
    console.error("Error removing cart item:", error);
    return res.status(500).json({ error: "Failed to remove product from cart" });
  }
});


module.exports = router;