# Secure Online Voting System - MERN

A production-style MERN demo for a small secure online voting workflow. It uses MongoDB, Express, React, and Node.js, with a separate Node OTP microservice. The app is designed for graceful degradation: operational errors are logged, API responses stay predictable, and partial failures do not crash the server or UI.

## Features

- Email/password auth with BCrypt hashing
- JWT authentication and role-based middleware for `VOTER`, `ADMIN`, and `SUPERVISOR`
- Google OAuth placeholder route and environment-based OAuth config
- OTP send/verify through a separate Node.js + Nodemailer service
- User approval, rejection, activation, deactivation, zone assignment, and profile-change approval
- Supervisor read-only zone monitoring
- Zone-based elections and candidates
- One-user-one-vote duplicate prevention through a unique MongoDB index
- Election start/end enforcement
- Voter ID PNG generation after approval, with safe skip on generation failure
- Audit logs for login, registration, OTP, profile updates, admin actions, and votes
- React loading states, skeletons, toast errors, localStorage JWT persistence, and refresh-safe dashboard routing

## Tech Stack

- Backend API: Node.js, Express, Mongoose, JWT, bcryptjs, express-validator
- Database: MongoDB
- OTP service: Node.js, Express, Nodemailer
- Frontend: React 18, Vite, lucide-react, react-hot-toast

## System Design

Layered backend flow:

`Route -> Service/Module -> Mongoose Model -> MongoDB`

Auth flow:

`React Login -> Express /auth/login -> BCrypt check -> JWT issued -> React stores token -> Protected APIs use Bearer token`

OTP flow:

`React/Backend OTP request -> Express /auth/otp/send -> OTP service /otp/send -> Nodemailer or DEV_MODE console OTP -> retry-safe response`

Voting flow:

`Voter dashboard -> zone election/candidates -> cast vote -> check verified/active/election window/zone/duplicate -> save vote + mark hasVoted + audit log`

## Folder Structure

```text
backend/
  src/
    config/       env and Mongo connection
    middleware/   JWT auth, validation, error handling
    models/       Mongoose schemas
    modules/
      auth/       login, registration, OTP bridge
      users/      profile APIs
      vote/       voting dashboard, cast vote, results
      admin/      approvals, status changes, zone assignment
      supervisor/ read-only zone monitoring
      zones/      zone APIs
      audit/      audit log service/routes
      voterId/    PNG voter ID generator
    app.js
    server.js
    seed.js
frontend/
  src/            React app, API client helpers, responsive UI
otp-service/
  src/server.js   Express OTP service
postman/          Postman collection
```

## MongoDB Collections

`users`
```json
{
  "email": "voter@vote.local",
  "password": "bcrypt",
  "fullName": "Verified Voter",
  "role": "VOTER",
  "isVerified": true,
  "isActive": true,
  "hasVoted": false,
  "zoneId": "zone-north",
  "voterIdPath": "generated-ids/...png",
  "demographics": { "ageRange": "26-40" },
  "pendingDemographics": { "ageRange": "41-60" }
}
```

`votes`
```json
{ "userId": "...", "candidateId": "...", "electionId": "election-2026", "zoneId": "zone-north", "createdAt": "..." }
```

`candidates`
```json
{ "name": "Ava Patel", "party": "Civic Forward", "zoneId": "zone-north", "electionId": "election-2026" }
```

`elections`
```json
{ "_id": "election-2026", "title": "Demo Municipal Election", "zoneId": "zone-north", "startAt": "...", "endAt": "...", "active": true }
```

`audit_logs`
```json
{ "userId": "...", "action": "VOTE_CAST", "details": "Vote cast for election election-2026", "createdAt": "..." }
```

## API Endpoints

Auth:

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/otp/send`
- `POST /auth/otp/verify`
- `GET /auth/oauth2/success`

Users:

- `GET /users/me`
- `PUT /users/me/profile`

Voting:

- `GET /vote/dashboard`
- `POST /vote/cast`
- `GET /vote/results/{electionId}` for `ADMIN` and `SUPERVISOR`

Admin:

- `GET /admin/users`
- `POST /admin/users/{id}/approve`
- `POST /admin/users/{id}/reject`
- `PATCH /admin/users/{id}/status`
- `PATCH /admin/users/{id}/zone`
- `POST /admin/users/{id}/profile/approve`
- `GET /admin/audit-logs`

Zones:

- `GET /zones`
- `POST /zones` for `ADMIN`

Supervisor:

- `GET /supervisor/zone-users`

## Request Examples

Login:
```http
POST /auth/login
Content-Type: application/json

{ "email": "voter@vote.local", "password": "Password123!" }
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt",
    "role": "VOTER",
    "email": "voter@vote.local",
    "verified": true,
    "active": true,
    "hasVoted": false
  }
}
```

Cast vote:
```http
POST /vote/cast
Authorization: Bearer <token>
Content-Type: application/json

{ "electionId": "election-2026", "candidateId": "<candidate-id-from-dashboard>" }
```

## Setup

Prerequisites:

- Node.js 18+
- MongoDB running locally or a MongoDB Atlas URI

1. Start MongoDB.

2. Install dependencies for all services:

```bash
npm run install:all
```

3. Start the full app from the root folder:

```bash
npm start
```

This starts `backend`, `otp-service`, and `frontend` together. To start only the backend and frontend, run:

```bash
npm run start:core
```

Manual service commands are also available:

Backend:

```bash
cd backend
cp .env.example .env
npm install
npm start
```

OTP service:

```bash
cd otp-service
cp .env.example .env
npm install
npm start
```

With `DEV_MODE=true`, OTPs are printed to the console instead of being emailed.

Frontend:

```bash
cd frontend
cp .env.example .env
npm install
npm start
```

Open `http://localhost:5173`.

## Demo Accounts

All demo accounts use password `Password123!`.

- `admin@vote.local` role `ADMIN`
- `supervisor@vote.local` role `SUPERVISOR`
- `voter@vote.local` role `VOTER`, approved
- `pending@vote.local` role `VOTER`, pending approval

## Fail-Safe Behavior

- Express routes use safe async wrappers and predictable `success/message/data` responses.
- Global middleware prevents stack traces from leaking to clients.
- Audit logging failures are logged and do not block primary actions.
- OTP email failures return retry-safe responses.
- Voter ID image generation failures are logged and approval still completes.
- Frontend API calls catch network failures, show toast errors, and keep the UI mounted.

## Postman

Import `postman/SecureVote.postman_collection.json`. Login first, then paste the returned JWT into the collection variable `token`.
