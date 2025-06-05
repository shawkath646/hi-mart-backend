const express = require("express");
const router = express.Router();
const axios = require('axios');
const { google } = require('googleapis');
const { db } = require("../libs/firebase");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { isAuthenticated } = require("../libs/auth");

const SECRET_KEY = process.env.SECRET_KEY;
if (!SECRET_KEY) throw new Error("SECRET_KEY is required");

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production", // must be true in production
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // fix this!
  maxAge: 24 * 60 * 60 * 1000,
  path: "/",
};


const SESSION_EXPIRY = 30 * 24 * 60 * 60 * 1000;

// Improved device info with timeout
const getDeviceInfo = async (req) => {
  const deviceInfo = {
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'] || "Unknown",
  };

  try {
    const geoRes = await axios.get(`http://ip-api.com/json/${deviceInfo.ip}`, { timeout: 1000 });
    deviceInfo.location = geoRes.data;
  } catch (err) {
    deviceInfo.location = "Unknown";
    console.log("Geolocation lookup failed:", err.message);
  }
  return deviceInfo;
};

// Common login handler
const handleSuccessfulLogin = async (res, userDoc, provider = 'credentials') => {
  const user = userDoc.data();
  const deviceInfo = await getDeviceInfo(res.req);

  const sessionId = require('crypto').randomBytes(16).toString('hex');
  await db.collection('sessions').doc(sessionId).set({
    userId: userDoc.id,
    deviceInfo,
    provider,
    expiresAt: new Date(Date.now() + SESSION_EXPIRY),
    createdAt: new Date(),
  });

  const token = jwt.sign({ userId: userDoc.id, sessionId, email: user.email }, SECRET_KEY, { expiresIn: "1d" });
  res.cookie("auth_token", token, COOKIE_OPTIONS);
  const { password, googleRefreshToken, facebookAccessToken, ...safeData } = user;
  return safeData;
};

// User registration
router.post("/register", async (req, res) => {
  try {
    const requiredFields = ['email', 'password', 'firstName', 'lastName', 'dateOfBirth', 'address', 'city', 'state', 'postalCode', 'country', 'phoneNumber'];
    const missingField = requiredFields.find(field => !req.body[field]);
    if (missingField) return res.status(400).json({ error: `Missing ${missingField}` });

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    const existingUser = await db.collection("users").where("email", "==", req.body.email).get();
    if (!existingUser.empty) {
      return res.status(409).json({ error: "User already exists" });
    }

    const userRef = db.collection("users").doc();
    const hashedPassword = await bcrypt.hash(req.body.password, 12);

    const newUser = {
      id: userRef.id,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      dateOfBirth: req.body.dateOfBirth,
      email: req.body.email,
      emailVerified: false,
      phoneNumber: req.body.phoneNumber,
      picture: '',
      password: hashedPassword,
      isSeller: false,
      joinedOn: new Date(),
      addresses: req.body.addresses || [{
        street: req.body.address,
        city: req.body.city,
        state: req.body.state,
        postalCode: req.body.postalCode,
        country: req.body.country,
        default: true
      }],
      paymentMethods: [],
    };

    await userRef.set(newUser);
    const user = await handleSuccessfulLogin(res, { id: userRef.id, ref: userRef, data: () => newUser });

    return res.status(201).json({ user });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Credentials login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    const snapshot = await db.collection("users").where("email", "==", email).get();
    if (snapshot.empty) return res.status(404).json({ error: "User not found" });

    const userDoc = snapshot.docs[0];
    const user = userDoc.data();

    if (!await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const userData = await handleSuccessfulLogin(res, userDoc);
    return res.json({ user: userData });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/login/google", async (_, res) => {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const scopes = [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: scopes,
    });

    return res.status(200).json({ url: authUrl });
  } catch (error) {
    console.error("Google login error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/login/google/callback", async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) return res.status(400).json({ error: "Authorization code required" });

    const tokenResponse = await axios.post(`https://oauth2.googleapis.com/token`, {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code'
    });

    const { id_token, refresh_token: refreshToken } = tokenResponse.data;

    const client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: id_token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();

    if (!payload.email_verified) {
      return res.status(403).json({ error: "Google email not verified" });
    }

    const { email, given_name, family_name, picture, sub, email_verified } = payload;
    const snapshot = await db.collection("users").where("email", "==", email).get();

    if (snapshot.empty) {
      const responseData = {
        email, firstName: given_name, lastName: family_name, picture
      };
      const html = `
        <html>
          <body>
            <script>
              window.opener.postMessage({
                type: 'user-not-found',
                user: ${JSON.stringify(responseData)}
              }, "${process.env.FRONTEND_URL}");
              window.close();
            </script>
          </body>
        </html>
      `;

      return res.status(404).send(html);
    }

    const userDoc = snapshot.docs[0];
    await userDoc.ref.update({
      googleId: sub,
      emailVerified: userDoc.data().emailVerified || email_verified,
      ...(refreshToken && { googleRefreshToken: refreshToken }),
      picture: picture || userDoc.data().picture
    });

    const userData = await handleSuccessfulLogin(res, userDoc, 'google');
    const html = `
      <html>
        <body>
          <script>
            window.opener.postMessage({
              type: 'google-auth-success',
              user: ${JSON.stringify(userData)}
            }, "${process.env.FRONTEND_URL}");
            window.close();
          </script>
        </body>
      </html>
    `;
    return res.status(200).send(html);
  } catch (error) {
    const html = `
      <html>
        <body>
          <script>
            window.opener.postMessage({
              type: 'google-auth-failure',
              error: ${JSON.stringify(error.message || 'Unknown error')}
            }, "${process.env.FRONTEND_URL}");
            window.close();
          </script>
        </body>
      </html>
    `;
    return res.status(500).send(html);
  }
});

// Facebook OAuth login
router.post("/login/facebook", async (req, res) => {
  try {
    const { accessToken } = req.body;
    if (!accessToken) return res.status(400).json({ error: "Access token required" });

    const response = await axios.get(
      `https://graph.facebook.com/v12.0/me?fields=id,first_name,last_name,email,picture&access_token=${accessToken}`
    );

    const { email, first_name, last_name, id, picture } = response.data;
    if (!email) return res.status(403).json({ error: "Email permission not granted" });

    const snapshot = await db.collection("users").where("email", "==", email).get();
    if (snapshot.empty) {
      return res.status(404).json({
        error: "User not found",
        signupData: {
          email, firstName: first_name, lastName: last_name,
          picture: picture?.data?.url
        }
      });
    }

    const userDoc = snapshot.docs[0];
    await userDoc.ref.update({
      facebookId: id,
      picture: picture?.data?.url || userDoc.data().picture
    });

    const userData = await handleSuccessfulLogin(res, userDoc, 'facebook');
    return res.json({ user: userData });
  } catch (error) {
    console.error("Facebook login error:", error.response?.data || error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Session endpoint
router.get("/session", isAuthenticated, async (req, res) => {
  try {
    const userDoc = await db.collection("users").doc(req.user.userId).get();
    if (!userDoc.exists) {
      res.clearCookie("auth_token");
      return res.status(404).json({ error: "User not found" });
    }
    const user = userDoc.data();
    const { password, googleRefreshToken, facebookAccessToken, ...safeData } = user;
    return res.json({ user: safeData });
  } catch (error) {
    console.error("Session error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Logout
router.post("/logout", isAuthenticated, async (req, res) => {
  try {
    await db.collection('sessions').doc(req.user.sessionId).delete();
    res.clearCookie("auth_token");
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;