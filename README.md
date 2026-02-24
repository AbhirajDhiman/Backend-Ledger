# Backend-Ledger

Backend-Ledger is a Node.js/Express backend for a banking ledger application.  
The frontend is intentionally deferred and will be implemented after backend completion and hardening.

## Project Status (Current)

**Phase:** Backend foundation in progress  
**API Health:** Running and connected to MongoDB  
**Auth Module:** Functional (`register`, `login`)  
**Email Integration:** Welcome email flow integrated (Nodemailer + OAuth2)  
**Frontend:** Not started yet (planned for next phase)

## Implemented Features

- User registration with validation
- Duplicate email protection
- Password hashing with `bcrypt`
- JWT token generation
- Token returned in JSON response and set in HttpOnly cookie
- User login with credential verification
- MongoDB connection via Mongoose
- Registration welcome email service

## Tech Stack

- Node.js
- Express
- MongoDB + Mongoose
- JWT (`jsonwebtoken`)
- `bcrypt`
- `cookie-parser`
- `dotenv`
- Nodemailer (OAuth2)

## Project Structure

```text
Backend-Ledger/
├── server.js
├── package.json
├── .env
└── src/
    ├── app.js
    ├── config/
    │   └── db.js
    ├── controllers/
    │   └── auth.controller.js
    ├── models/
    │   └── user.model.js
    ├── routes/
    │   └── auth.routes.js
    └── services/
        └── email.service.js
```

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
- [ ] Add auth middleware and protected routes
- [ ] Add ledger/account domain models
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
