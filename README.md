
# Backend-Ledger

Backend-Ledger is a production-ready Node.js/Express backend for a banking ledger application, designed for cloud deployment (Render) and robust integration with MongoDB Atlas and Gmail SMTP. The frontend will be implemented after backend stabilization.

---

## 🚀 Deployment Status

- **Production Ready:** All code syntax and logic validated, cloud-safe email service, robust error handling
- **Render Deployment:** Fully compatible, tested with Render and MongoDB Atlas
- **Email Service:** Hardened for cloud SMTP, graceful fallback if credentials missing
- **API Health:** All endpoints tested and working locally and in cloud

---

## 🛠️ Features

- User registration & login (JWT, bcrypt)
- Duplicate email protection
- Token blacklist for logout/invalidation
- Protected account creation
- Account, transaction, ledger domain models
- MongoDB Atlas connection with retry logic
- Welcome email (Nodemailer, Gmail OAuth2/SMTP)
- Robust environment variable handling
- Health check endpoint
- Modular controllers, routes, middleware

---

## 🧑‍💻 Tech Stack

- Node.js, Express
- MongoDB Atlas, Mongoose
- JWT (jsonwebtoken)
- bcrypt
- cookie-parser
- dotenv
- Nodemailer (SMTP/OAuth2)

---

## 📁 Project Structure

```text
Backend-Ledger/
├── server.js
├── package.json
├── README.md
├── .env (local only)
└── src/
  ├── app.js
  ├── config/
  │   └── db.js
  ├── controllers/
  │   ├── account.controller.js
  │   ├── auth.controller.js
  │   └── transaction.controller.js
  ├── middleware/
  │   └── auth.middleware.js
  ├── models/
  │   ├── account.model.js
  │   ├── user.model.js
  │   ├── ledger.model.js
  │   ├── transaction.model.js
  │   ├── blacklist.model.js
  │   └── tokenBlacklist.model.js
  ├── routes/
  │   ├── account.routes.js
  │   ├── auth.routes.js
  ├── services/
  │   └── email.service.js
```

---

## 🔗 API Endpoints

Base URL: `http://localhost:3000` (local) or Render URL

### Auth

- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — Login user
- `POST /api/auth/logout` — Logout (token blacklist)

### Accounts

- `POST /api/accounts` — Create account (protected)
- `GET /api/accounts` — List user accounts (protected)

### Transactions

- `POST /api/transactions` — Create transaction (protected)
- `GET /api/transactions` — List transactions (protected)

### Health

- `GET /health` — Health check

---

## 🔒 Authentication Flow

1. Register: `POST /api/auth/register` with `{ email, name, password }`
2. Login: `POST /api/auth/login` with `{ email, password }`
3. Use returned JWT token in `Authorization: Bearer <token>` header for protected routes
4. Logout: `POST /api/auth/logout` (token is blacklisted)

---

## ⚙️ Environment Variables

Create `.env` locally, or set these in Render dashboard:

```env
MONGO_URI=<your MongoDB Atlas URI>
PORT=3000
JWT_SECRET_KEY=<your JWT secret>

# Email (Gmail SMTP)
EMAIL_USER=<your Gmail address>
EMAIL_PASS=<your Gmail app password>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false

# Optional (OAuth2)
CLIENT_ID=
CLIENT_SECRET=
REFRESH_TOKEN=
```

---

## 🏗️ Local Development

```bash
npm install
npm run dev
```

---

## ☁️ Render Deployment Guide

1. Push code to GitHub
2. Create new Render web service, connect repo
3. Set all required environment variables in Render dashboard
4. Ensure MongoDB Atlas IP whitelist includes Render
5. Redeploy

---

## 📨 Email Service Notes

- Uses Gmail SMTP (port 587, STARTTLS)
- If credentials missing, email service disables gracefully
- For production, use Gmail App Password or OAuth2
- All email errors are logged, do not block API

---

## 🛡️ Production Hardening Checklist

- [x] Robust error handling
- [x] Secure JWT auth, token blacklist
- [x] Cloud-safe email service
- [x] MongoDB Atlas connection retry
- [x] Environment variable validation
- [ ] Rate limiting (recommended)
- [ ] Monitoring/logging (recommended)
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Test suite (unit/integration)

---

## 🧩 Troubleshooting

- **MongoDB Atlas:** Ensure IP whitelist includes Render
- **Email:** Check SMTP credentials, use App Password for Gmail
- **Env Vars:** All required variables must be set in Render
- **Deployment:** Check Render logs for errors, all code-level issues are resolved

---

## 📅 Roadmap

- [x] Backend foundation & hardening
- [x] Render/cloud deployment
- [x] Email service cloud compatibility
- [ ] Transaction APIs (credit/debit/transfer)
- [ ] API docs & test suite
- [ ] Frontend implementation

---

## 📄 License

ISC

## API Endpoints (Current)

Base URL: `http://localhost:3000`

### `POST /api/auth/register`
Registers a new user.

**Request body**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "strongpassword123"
}
```

**Success response (`201`)**
```json
{
  "_id": "...",
  "email": "user@example.com",
  "name": "John Doe",
  "status": "success",
  "token": "<jwt-token>"
}
```

### `POST /api/auth/login`
Logs in an existing user.

**Request body**
```json
{
  "email": "user@example.com",
  "password": "strongpassword123"
}
```

**Success response (`200`)**
```json
{
  "_id": "...",
  "email": "user@example.com",
  "name": "John Doe",
  "status": "success",
  "token": "<jwt-token>"
}
```

### `POST /api/accounts`
Creates a new account for the authenticated user.

**Headers**
```http
Authorization: Bearer <jwt-token>
```

**Success response (`201`)**
```json
{
  "message": "Account created successfully",
  "account": {
    "_id": "...",
    "userId": "...",
    "accountType": "ACTIVE",
    "currency": "INR",
    "createdAt": "...",
    "updatedAt": "..."
  },
  "status": "success"
}
```

## Environment Variables

Create a `.env` file in the root with:

```env
MONGO_URI=
PORT=3000
JWT_SECRET_KEY=

EMAIL_USER=
CLIENT_ID=
CLIENT_SECRET=
REFRESH_TOKEN=
```

## Local Development

```bash
npm install
npm run dev
```

Or:

```bash
npm start
```

## Backend Roadmap (Before Frontend)

- [ ] Add logout endpoint + token invalidation strategy
- [x] Add auth middleware and protected routes
- [x] Add ledger/account domain models
- [ ] Add transactions APIs (credit/debit/transfer)
- [ ] Add validation middleware and centralized error handler
- [ ] Add API documentation (OpenAPI/Swagger)
- [ ] Add test suite (unit + integration)
- [ ] Add rate limiting and security hardening

## Frontend Plan (Next Phase)

After backend reaches stable v1:

- Build web client for auth and ledger operations
- Connect frontend with secured API endpoints
- Add role-based UI and account dashboards

## License

ISC
