# Backend Ledger

Backend Ledger is a full-stack financial ledger application built to demonstrate production-minded backend engineering with a practical React product surface.

It implements secure authentication, account management, immutable ledger entries, idempotent transfers, and a clean frontend workflow that makes the full business flow easy to demonstrate in interviews, portfolio reviews, and technical discussions.

## Table of Contents

1. Project Overview
2. Product Goals
3. Core Features
4. Architecture
5. Tech Stack
6. Repository Structure
7. Data Model and Domain Design
8. API Reference
9. Security and Reliability Decisions
10. Local Development Setup
11. Build and Run Commands
12. End-to-End User Flow
13. What I Implemented
14. What I Learned
15. Experience I Gained
16. Known Limitations and Next Improvements
17. Deployment Notes

## Project Overview

Backend Ledger simulates a minimal digital banking ledger where users can:

- Register and authenticate securely
- Create one or more wallet accounts
- View account balances computed from ledger history
- Perform transfers with idempotency protection
- See transaction history for their own accounts
- Receive non-blocking email notifications for key actions

The backend is intentionally API-first and modeled around ledger correctness. The frontend focuses on product clarity: every screen maps directly to a meaningful backend capability.

## Product Goals

- Design a backend that prioritizes correctness and traceability over shortcut state updates.
- Model balance as a derived value from immutable ledger entries.
- Prevent duplicate payment side effects using idempotency keys.
- Keep authentication simple but production-minded (JWT + blacklist on logout + protected routes).
- Build a resume-ready frontend that shows complete flow, not isolated API calls.

## Core Features

### Authentication and Session Management

- User registration with hashed passwords (bcrypt)
- User login with credential verification
- JWT issuance on login/register
- Token sent both in response body and httpOnly cookie
- Logout flow with token blacklisting and cookie cleanup

### Account Management

- Authenticated users can create accounts
- Users can list only their own accounts
- Account balance endpoint derives balance from ledger entries, not from mutable balance columns

### Transfer Engine

- Transfer API enforces required fields and account validation
- Supports idempotency key handling to avoid duplicate execution
- Uses MongoDB transactions/sessions for atomic ledger writes
- Creates both debit and credit ledger entries
- Marks transaction lifecycle state (PENDING -> COMPLETED)

### Deposit (Demo Faucet)

- Authenticated users can credit their own account through a demo deposit endpoint
- Useful for onboarding/demo without requiring system-funded setup first

### Observability and UX Support

- Health endpoint for service monitoring
- Root endpoint exposes API pointers
- React dashboard shows backend health, auth state, balances, transfer form, and recent transactions

## Architecture

### High-Level Components

- Frontend: React + Vite application in frontend/
- Backend API: Express app in server/
- Database: MongoDB with Mongoose models and indexes
- Mail layer: Nodemailer service with OAuth2-ready SMTP configuration

### Request Flow (Typical Protected Endpoint)

1. Client sends JWT through Authorization header (or cookie).
2. Auth middleware verifies token signature.
3. Middleware checks blacklist to reject logged-out tokens.
4. Controller validates business input.
5. Model operations run (with transactions where needed).
6. API responds with normalized JSON payload.

### Transfer Flow (Business-Critical Path)

1. Validate request payload.
2. Validate idempotency key uniqueness and prior status handling.
3. Validate account existence and ACTIVE status.
4. Derive sender balance from ledger aggregation.
5. Start MongoDB session/transaction.
6. Insert transaction as PENDING.
7. Insert DEBIT ledger entry.
8. Insert CREDIT ledger entry.
9. Update transaction to COMPLETED.
10. Commit transaction and send notification email.

## Tech Stack

### Backend

- Node.js
- Express 5
- MongoDB + Mongoose
- JWT (jsonwebtoken)
- bcrypt
- cookie-parser
- CORS with explicit origin policy
- Nodemailer

### Frontend

- React 19
- Vite
- Native fetch-based API client
- Custom CSS design system

### Workspace Tooling

- concurrently for running frontend and backend together

## Repository Structure

```text
Backend-Ledger/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
├── server/
│   ├── src/
│   │   ├── app.js
│   │   ├── config/
│   │   │   └── db.js
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   └── services/
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── package.json
└── README.md
```

## Data Model and Domain Design

### User

- Unique email (normalized to lowercase)
- Name
- Hashed password (stored with select: false)
- systemuser flag for privileged system flows

### Account

- Belongs to a user
- accountType enum: ACTIVE, FROZEN, CLOSED
- Currency (default INR)
- No mutable balance field
- getBalance() derives value from ledger aggregation pipeline

### Transaction

- fromaccount and toaccount references
- amount
- status enum: PENDING, COMPLETED, FAILED, REVERSED
- idempotencyKey
- timestamps for auditability

### Ledger (Immutable by Design)

- account reference
- transaction reference
- amount
- type enum: DEBIT or CREDIT
- schema-level guards prevent update/delete operations after creation

### Token Blacklist

- Stores JWTs invalidated at logout
- TTL index cleans older tokens automatically

## API Reference

Base URL (local): http://localhost:3000

### Health and Root

- GET /
- GET /health

### Auth

- POST /api/auth/register
	- Body: name, email, password
	- Returns: user identity + token

- POST /api/auth/login
	- Body: email, password
	- Returns: user identity + token

- POST /api/auth/logout
	- Auth required
	- Blacklists token and clears cookie

### Accounts

- POST /api/accounts
	- Auth required
	- Creates a new account for authenticated user

- GET /api/accounts
	- Auth required
	- Returns all accounts belonging to authenticated user

- GET /api/accounts/balance/:accountId
	- Auth required
	- Returns derived balance for owned account

### Transactions

- GET /api/transactions
	- Auth required
	- Returns latest 20 transactions involving user-owned accounts

- POST /api/transactions
	- Auth required
	- Body: fromaccount, toaccount, amount, idempotencyKey
	- Executes transfer with idempotent behavior

- POST /api/transactions/deposit
	- Auth required
	- Body: accountId, amount
	- Demo deposit endpoint for account funding

## Security and Reliability Decisions

### Authentication Security

- Password hashing with bcrypt
- JWT verification in middleware
- Token blacklist check for logout invalidation
- httpOnly cookie support for browser-based sessions

### Access Control

- All account and transaction routes are protected
- Account read/write operations scoped by authenticated user ID
- Deposit endpoint enforces ownership of target account

### Idempotency and Transaction Safety

- Transfer endpoint checks idempotency key before any write path
- MongoDB session-based transaction wraps transaction record + ledger entries
- Prevents partial state updates in core money movement flow

### Ledger Integrity

- Ledger entries are append-only and immutable
- Balance is always computed from ledger source-of-truth events

### Operational Resilience

- Backend can boot even when MongoDB is temporarily unavailable
- Reconnection strategy retries every 10 seconds
- Health endpoint provides quick liveness insight

## Local Development Setup

### Prerequisites

- Node.js 18+
- npm 9+
- MongoDB Atlas cluster (or compatible MongoDB instance)

### 1. Clone and install dependencies

```bash
git clone <your-repo-url>
cd Backend-Ledger
npm install
npm install --prefix server
npm install --prefix frontend
```

### 2. Configure backend environment

Create server/.env from server/.env.example:

```env
MONGO_URI=<your-mongodb-atlas-uri>
PORT=3000
JWT_SECRET_KEY=<your-jwt-secret>
FRONTEND_URL=http://localhost:5173
ALLOW_VERCEL_PREVIEWS=true
EMAIL_USER=
EMAIL_PASS=
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
CLIENT_ID=
CLIENT_SECRET=
REFRESH_TOKEN=
```

Notes:

- If OAuth2 email variables are missing, the app still runs and email sending is disabled safely.
- Make sure MongoDB network access and credentials are valid.

### 3. Configure frontend environment

Create frontend/.env from frontend/.env.example:

```env
VITE_API_BASE_URL=http://localhost:3000
```

### 4. Start development servers

From project root:

```bash
npm run dev
```

This starts:

- Frontend: http://localhost:5173
- Backend: http://localhost:3000

Run services independently if needed:

```bash
npm run dev:server
npm run dev:frontend
```

## Build and Run Commands

From repository root:

- Development (frontend + backend): npm run dev
- Backend only (dev): npm run dev:server
- Frontend only (dev): npm run dev:frontend
- Backend production start: npm run start
- Frontend production build: npm run build

## End-to-End User Flow

1. Open frontend and verify backend health card.
2. Register a user or login with existing credentials.
3. Create at least two accounts.
4. Use deposit action to fund an account.
5. Submit a transfer with generated idempotency key.
6. Verify updated balances and activity feed.
7. Logout and confirm protected calls are rejected without valid auth.

## What I Implemented

### Backend Engineering

- Modular Express architecture with routes, controllers, middleware, models, and services separation.
- Full JWT auth lifecycle (register, login, logout, blacklist strategy).
- Protected account APIs with ownership-aware data access.
- Ledger-based balance derivation using aggregation pipeline logic.
- Transaction orchestration with MongoDB sessions for atomic debit/credit writes.
- Idempotency handling to reduce duplicate transfer risk.
- Resilient DB connection layer with retry behavior.
- Email integration with non-blocking send path.

### Frontend Product Layer

- React dashboard connected to real backend APIs.
- Auth screens (register/login/logout) with local persistence.
- Accounts list with live balance retrieval.
- Deposit and transfer interactions with feedback states.
- Recent transaction timeline for quick verification.
- Health indicator and API base visibility for developer confidence.

### Developer Experience

- Monorepo-style root scripts for one-command startup.
- Clear environment variable templates.
- API and flow documentation for portfolio-ready presentation.

## What I Learned

- Why immutable ledgers are safer than storing mutable account balances.
- How idempotency keys protect transaction endpoints from duplicate execution.
- How to apply MongoDB transactions to keep financial write operations consistent.
- How to combine cookie-based and bearer-token auth ergonomically.
- Why middleware-driven authorization improves maintainability.
- How to design API responses that are easy for frontend state management.
- How to keep optional integrations (email) non-blocking so core flows stay reliable.
- How to structure a full-stack repository for real-world readability and collaboration.

## Experience I Gained

- Thinking in domain models, not only CRUD endpoints.
- Translating business rules (ownership, account status, balance checks) into enforceable backend code.
- Building trust-oriented backend behavior: predictable errors, idempotent writes, and auditable history.
- Integrating frontend UX with backend constraints (loading, errors, disabled states, and flow sequencing).
- Writing project documentation that communicates implementation depth to recruiters and engineering teams.

## Known Limitations and Next Improvements

- Missing automated tests (unit/integration/e2e) for critical flows.
- No rate limiting yet on auth and transaction endpoints.
- Idempotency key uniqueness can be further hardened with indexed constraints/scoping.
- Email service still uses optional env setup and can be expanded with queue-based retry.
- No admin/internal observability dashboard yet (metrics, tracing, structured logs).
- No CI pipeline defined in repository currently.

Recommended next upgrades:

1. Add Jest + Supertest integration tests for auth/accounts/transactions.
2. Add request validation with a schema library (for example Zod/Joi).
3. Add centralized error middleware and structured logging.
4. Add rate limiting and helmet-based hardening.
5. Add Docker + CI for build/test automation and deployment consistency.

## Deployment Notes

### Frontend

- Can be deployed to Vercel/Netlify as static build output.
- Ensure VITE_API_BASE_URL points to deployed backend URL.

### Backend

- Can be deployed to Render/Railway/Fly.io/VM/container runtime.
- Configure CORS FRONTEND_URL to deployed frontend origin.
- Use strong JWT secret and secure environment management.

### CORS Preview Support

- ALLOW_VERCEL_PREVIEWS=true allows preview domains ending in .vercel.app in addition to explicitly configured origins.

---

If you are evaluating this project, start with the transfer flow and ledger model: those represent the most important engineering decisions in this implementation.
