const { db } = require("../libs/firebase");
const jwt = require("jsonwebtoken");

const SECRET_KEY = process.env.SECRET_KEY;
if (!SECRET_KEY) throw new Error("SECRET_KEY is required");

const isAuthenticated = async (req, res, next) => {
  const authToken = req.cookies.auth_token;
  
  if (!authToken) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(authToken, SECRET_KEY);
    
    // Verify session exists and is valid
    const sessionDoc = await db.collection('sessions').doc(decoded.sessionId).get();
    if (!sessionDoc.exists) {
      res.clearCookie("auth_token");
      return res.status(401).json({ error: "Session expired" });
    }

    // Check if session expired
    if (new Date(sessionDoc.data().expiresAt) < new Date()) {
      await sessionDoc.ref.delete();
      res.clearCookie("auth_token");
      return res.status(401).json({ error: "Session expired" });
    }

    // Attach minimal user info to request
    req.user = {
      userId: decoded.userId,
      sessionId: decoded.sessionId
    };

    next();
  } catch (err) {
    res.clearCookie("auth_token");
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: "Session expired" });
    }
    return res.status(401).json({ error: "Invalid authentication token" });
  }
};

const optionalAuthentication = async (req, res, next) => {
  try {
    const authToken = req.cookies.auth_token;
    
    if (!authToken) {
      return next();
    }

    const decoded = jwt.verify(authToken, SECRET_KEY);
    
    // Verify session exists and is valid
    const sessionDoc = await db.collection('sessions').doc(decoded.sessionId).get();
    if (!sessionDoc.exists) {
      res.clearCookie("auth_token");
      return next();
    }

    if (new Date(sessionDoc.data().expiresAt) < new Date()) {
      await sessionDoc.ref.delete();
      res.clearCookie("auth_token");
      return next();
    }

    req.user = {
      userId: decoded.userId,
      sessionId: decoded.sessionId
    };

    next();
  } catch (error) {
    next();
  }
};

module.exports = { isAuthenticated, optionalAuthentication };