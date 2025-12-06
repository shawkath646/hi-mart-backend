<div align="center">

# 🛒 HiMart - Backend API

### E-Commerce REST API | Express.js | Firebase | JWT Authentication

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.1.0-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Firebase](https://img.shields.io/badge/Firebase-13.4.0-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![JWT](https://img.shields.io/badge/JWT-9.0.2-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)

</div>

---

## 📋 Table of Contents

- [About](#-about)
- [Purpose](#-purpose)
- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [API Routes](#-api-routes)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Deployment](#-deployment)
- [Author](#-author)
- [Made By](#-made-by)

---

## 🎯 About

**HiMart Backend** is a robust RESTful API built with Express.js and Firebase, providing comprehensive e-commerce functionality including user authentication, product management, shopping cart operations, and seller dashboard features. Designed with security, scalability, and performance in mind.

**Keywords**: REST API, Express.js, Firebase Firestore, JWT Authentication, E-Commerce Backend, Node.js API, Google OAuth, Shopping Cart API

---

## 🎨 Purpose

This backend API serves multiple purposes:

- **User Authentication**: Secure JWT-based authentication with social login support (Google, Facebook)
- **Product Management**: CRUD operations for products with Firebase Storage integration
- **Shopping Cart**: Persistent cart management with guest cart synchronization
- **Seller Features**: Dedicated endpoints for sellers to manage their products and inventory
- **Session Management**: Secure session handling with device tracking and geolocation
- **Search Functionality**: Fast product search with scoring algorithm
- **Order Processing**: Complete checkout and order management system

---

## ✨ Features

### 🔐 **Authentication & Security**

- ✅ **JWT Authentication** - Secure token-based authentication with httpOnly cookies
- ✅ **Password Hashing** - bcrypt with salt rounds for secure password storage
- ✅ **Social Login** - Google and Facebook OAuth2 integration
- ✅ **Session Management** - Device tracking, IP logging, and geolocation
- ✅ **Session Expiry** - Automatic session cleanup after 30 days
- ✅ **CORS Configuration** - Secure cross-origin resource sharing
- ✅ **Cookie Security** - httpOnly, secure, and sameSite configurations

### 🛍️ **E-Commerce Features**

- ✅ **Product CRUD** - Create, read, update, delete products
- ✅ **Category Management** - Organize products by categories
- ✅ **Product Search** - Smart search with keyword matching and scoring
- ✅ **Shopping Cart** - Add, update, remove items with quantity management
- ✅ **Cart Synchronization** - Merge guest cart with user cart on login
- ✅ **Product Filtering** - Filter by category, price, trending, latest, discounts
- ✅ **Stock Management** - Real-time inventory tracking

### 🏪 **Seller Dashboard**

- ✅ **Seller Registration** - Become a seller with verification
- ✅ **Product Analytics** - Track impressions, clicks, and sales
- ✅ **Inventory Management** - Update stock levels and product details
- ✅ **Image Upload** - Firebase Storage integration for product images
- ✅ **Seller Authentication** - Separate authentication for seller accounts

### 📊 **Data & Analytics**

- ✅ **Product Impressions** - Track product views and engagement
- ✅ **Click Tracking** - Monitor product clicks for analytics
- ✅ **Sales Metrics** - Track total sales and revenue
- ✅ **User Preferences** - Cookie-based product recommendations
- ✅ **Geolocation** - IP-based location tracking for sessions

---

## 🛠️ Technology Stack

### **Backend Framework**

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)

</div>

- **Node.js** - JavaScript runtime environment
- **Express 5.1.0** - Fast, minimalist web framework
- **Firebase Admin 13.4.0** - Firebase Admin SDK for Firestore and Storage
- **Nodemon 3.1.10** - Auto-restart development server

### **Authentication & Security**

- **JSON Web Token 9.0.2** - JWT token generation and verification
- **bcryptjs 3.0.2** - Password hashing and comparison
- **cookie-parser 1.4.7** - Parse HTTP cookies
- **CORS 2.8.5** - Cross-Origin Resource Sharing
- **dotenv 16.5.0** - Environment variable management

### **External APIs**

- **Google APIs 149.0.0** - Google OAuth2 for social login
- **Axios 1.9.0** - HTTP client for API calls

---

## 📁 Project Structure

```
hi-mart-backend/
├── 📂 constant/                 # Constants and static data
│   └── (removed after seeding)
│
├── 📂 libs/                     # Core libraries
│   ├── auth.js                 # JWT authentication middleware
│   ├── firebase.js             # Firebase Admin initialization
│   ├── helper.js               # Helper functions
│   └── utils.js                # Utility functions
│
├── 📂 routes/                   # API route handlers
│   ├── cart.js                 # Shopping cart endpoints
│   ├── product.js              # Single product operations
│   ├── products.js             # Product listing & search
│   ├── seller.js               # Seller-specific endpoints
│   └── user.js                 # User authentication & management
│
├── 📄 index.js                  # App entry point
├── 📄 package.json              # Dependencies
├── 📄 .env                      # Environment variables
└── 📄 README.md                 # This file
```

---

## 🗺️ API Routes

### **Authentication Routes** (`/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register new user | ❌ |
| POST | `/auth/login` | Login with email/password | ❌ |
| POST | `/auth/login/google` | Initiate Google OAuth | ❌ |
| POST | `/auth/login/facebook` | Initiate Facebook OAuth | ❌ |
| GET | `/auth/session` | Get current user session | ✅ |
| POST | `/auth/logout` | Logout user | ✅ |

### **Product Routes** (`/products`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/products` | Get all products (with pagination) | ❌ |
| GET | `/products/trending` | Get trending products | ❌ |
| GET | `/products/latest` | Get latest products | ❌ |
| GET | `/products/user-choices` | Get personalized recommendations | ❌ |
| GET | `/products/discounts` | Get discounted products | ❌ |
| GET | `/products/minisearch` | Search products (min 2 chars) | ❌ |

### **Single Product Route** (`/product`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/product?id={id}` | Get product by ID | ❌ |

### **Cart Routes** (`/cart`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/cart/count` | Get cart item count | ✅ |
| GET | `/cart` | Get all cart items | ✅ |
| POST | `/cart` | Add item to cart | ✅ |
| PUT | `/cart` | Update cart item quantity | ✅ |
| DELETE | `/cart` | Remove item from cart | ✅ |
| POST | `/cart/sync` | Sync guest cart with user cart | ✅ |

### **Seller Routes** (`/seller`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/seller/register` | Register as seller | ✅ |
| GET | `/seller/login` | Seller login | ❌ |
| GET | `/seller/session` | Get seller session | ✅ (Seller) |
| POST | `/seller/logout` | Seller logout | ✅ (Seller) |
| POST | `/seller/add-product` | Add new product | ✅ (Seller) |
| GET | `/seller/my-products` | Get seller's products | ✅ (Seller) |
| PUT | `/seller/product` | Update product | ✅ (Seller) |
| DELETE | `/seller/product/:id` | Delete product | ✅ (Seller) |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.x or higher
- **npm**, **yarn**, **pnpm**, or **bun** package manager
- **Firebase Project** with Firestore and Storage enabled
- **Google Cloud Project** for OAuth (optional)

### Installation

```bash
# Clone the repository
git clone https://github.com/shawkath646/hi-mart-backend.git
cd hi-mart-backend

# Install dependencies
npm install
# or
yarn install
# or
pnpm install
```

### Development

```bash
# Run development server with nodemon
npm run dev

# Server runs on http://localhost:5000
```

### Production

```bash
# Start production server
npm start
```

---

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Secrets
SECRET_KEY=your_jwt_secret_key_here

# Firebase Configuration
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_STORAGE_BUCKET=your_bucket_name

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Facebook OAuth (Optional)
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

### Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Firestore Database
4. Enable Firebase Storage
5. Go to Project Settings > Service Accounts
6. Click "Generate new private key"
7. Copy credentials to `.env` file

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URIs
4. Copy Client ID and Secret to `.env`

---

## 🌐 Deployment

### Deploy to Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### Deploy to Render

1. Push code to GitHub
2. Connect repository in Render
3. Add environment variables
4. Deploy

### Deploy to Heroku

```bash
# Install Heroku CLI
npm i -g heroku

# Login and create app
heroku login
heroku create hi-mart-api

# Set environment variables
heroku config:set SECRET_KEY=your_secret

# Deploy
git push heroku main
```

### Deploy to Other Platforms

Compatible with any Node.js hosting:

- **AWS EC2** - Virtual servers
- **Google Cloud Run** - Serverless containers
- **DigitalOcean App Platform** - Managed hosting
- **Azure App Service** - Microsoft cloud

---

## 👨‍💻 Author

**Shawkat Hossain Maruf**

- 🌐 Website: [shawkath646.pro](https://shawkath646.pro)
- 💼 LinkedIn: [linkedin.com/in/shawkath645](https://linkedin.com/in/shawkath645)
- 📧 Email: <shawkath646@gmail.com>
- 🐙 GitHub: [@shawkath646](https://github.com/shawkath646)

**About Me**: Full-stack developer and Computer Science student at Sejong University, specializing in React, Next.js, TypeScript, and modern web technologies. Passionate about creating scalable, secure, and performant backend systems.

---

## 🏢 Powered By

<div align="center">

<img src="https://cloudburstlab.vercel.app/api/branding/logo?variant=transparent" alt="Cloudburst Lab" width="200" />


**Cloudburst Lab** is a digital innovation studio focused on creating exceptional web and mobile applications. We specialize in modern JavaScript frameworks, cloud technologies, and user-centric design principles.

</div>

## 📄 License

This project is **proprietary** and © 2024-2025 Shawkat Hossain Maruf. All rights reserved.

The source code is available for viewing and learning purposes. For commercial use, collaboration, or inquiries, please contact the author.

---

## 🙏 Acknowledgments

- **Express.js Team** - For the robust web framework
- **Firebase** - For the powerful backend services
- **Google** - For OAuth2 and API services
- **Open Source Community** - For incredible tools and libraries

---

## 📊 API Stats

![Node.js](https://img.shields.io/badge/Runtime-Node.js_18+-339933?style=flat-square&logo=node.js)
![Express](https://img.shields.io/badge/Framework-Express_5-000000?style=flat-square&logo=express)
![Firebase](https://img.shields.io/badge/Database-Firebase-FFCA28?style=flat-square&logo=firebase)
![Security](https://img.shields.io/badge/Security-JWT-000000?style=flat-square&logo=jsonwebtokens)
![Code Quality](https://img.shields.io/badge/Code_Quality-A+-success?style=flat-square)

---

<div align="center">

### ⭐ Star this repository if you find it helpful

</div>
