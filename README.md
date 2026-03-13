# Backend Ledger

Backend Ledger is a full-stack ledger banking demo organized as a resume-ready project. The backend lives inside the server folder as an Express and MongoDB API, and the frontend lives inside the frontend folder as a React dashboard that demonstrates the real product flow.

## Structure

```text
Backend-Ledger/
├── frontend/
│   ├── src/
│   ├── .env.example
│   └── package.json
├── server/
│   ├── src/
│   ├── .env.example
│   └── package.json
├── package.json
└── README.md
```

## What the project shows

- JWT-based authentication with registration, login, and logout
- Protected account creation and account balance lookup
- Transfer execution with idempotency keys
- Ledger-derived balances backed by MongoDB
- Resume-friendly React UI for demonstrating backend capabilities

## Tech stack

- Backend: Node.js, Express, MongoDB, Mongoose, JWT, Nodemailer
- Frontend: React, Vite, CSS
- Workspace tooling: concurrently

## Run locally

### 1. Backend environment

Copy server/.env.example to server/.env and provide your values.

Required values:

```env
MONGO_URI=<your MongoDB Atlas URI>
JWT_SECRET_KEY=<your JWT secret>
PORT=3000
FRONTEND_URL=http://localhost:5173
```

### 2. Frontend environment

Copy frontend/.env.example to frontend/.env if you want to override the API URL.

```env
VITE_API_BASE_URL=http://localhost:3000
```

### 3. Install and run

From the repository root:

```bash
npm install
npm run dev
```

That starts:

- Frontend at http://localhost:5173
- Backend at http://localhost:3000

You can also run each side separately:

```bash
npm run dev:server
npm run dev:frontend
```

## API summary

### Public

- POST /api/auth/register
- POST /api/auth/login
- GET /health

### Protected

- POST /api/auth/logout
- POST /api/accounts
- GET /api/accounts
- GET /api/accounts/balance/:accountId
- GET /api/transactions
- POST /api/transactions

Protected endpoints accept the JWT in the Authorization header as Bearer token. The backend also sets an httpOnly cookie for browser sessions.

## Frontend walkthrough

The React app is designed to make the backend understandable quickly:

1. Register or log in.
2. Create at least two accounts.
3. Inspect balances pulled from the ledger.
4. Submit a transfer and see it appear in recent activity.

## Build

To verify the frontend production bundle:

```bash
npm run build
```

## Notes

- The backend starts even if MongoDB is temporarily unavailable, but data operations will fail until the connection recovers.
- Email delivery is non-blocking and depends on valid SMTP credentials.
- The transaction history endpoint returns the latest 20 transfers involving the authenticated user's accounts.
