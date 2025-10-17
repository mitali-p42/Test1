# JWT Auth Starter (React + NestJS + PostgreSQL)

End-to-end login/register with email + password, JWT auth, route protection, and a minimal React frontend.

## Prereqs
- Node 18+
- PostgreSQL 13+

## 1) Backend
```bash
cd backend
cp .env.example .env
npm i
npm run start:dev
```
- Default API: http://localhost:4000
- Endpoints:
  - `POST /auth/register` → `{ access_token }`
  - `POST /auth/login` → `{ access_token }`
  - `GET /auth/me` (Bearer token) → `{ id, email, createdAt }`

Quick test:
```bash
curl -X POST http://localhost:4000/auth/register   -H 'Content-Type: application/json'   -d '{"email":"a@b.com","password":"password123"}'

curl -X POST http://localhost:4000/auth/login   -H 'Content-Type: application/json'   -d '{"email":"a@b.com","password":"password123"}'
# copy access_token
TOKEN=... 
curl http://localhost:4000/auth/me -H "Authorization: Bearer $TOKEN"
```

## 2) Frontend
```bash
cd frontend
cp .env.example .env
npm i
npm run dev
```
- Default app: http://localhost:5173

## Notes
- **Password hashing**: bcrypt with 12 rounds.
- **JWT**: Bearer tokens; payload includes `sub` (user id) and `email`.
- **DB schema**: `users(id uuid pk, email unique, password_hash, created_at timestamptz default now())` — handled by TypeORM entity. In dev, `synchronize: true` auto-creates table.
- **CORS**: enabled for `http://localhost:5173`.

## AI SDK Configuration (optional)
This starter is auth-focused. To add AI SDKs (OpenAI, Deepgram, AssemblyAI, Whisper):
1. Install SDK(s) in **backend**: `npm i openai deepgram-sdk assemblyai` (choose what you need).
2. Add provider keys to `backend/.env` (e.g., `OPENAI_API_KEY=...`).
3. Create a new NestJS module (e.g., `ai/ai.module.ts`) with a service that calls provider APIs.
4. Protect the AI routes with `@UseGuards(JwtAuthGuard)` so only logged-in users can access them.

Example protected route stub:
```ts
// backend/src/ai/ai.controller.ts
@Post('summarize')
@UseGuards(JwtAuthGuard)
summarize(@Body() dto: { text: string }) { /* call provider */ }
```

## Production Hardening
- Use migrations (disable `synchronize`)
- Store only password hashes; never return them
- Set strong `JWT_SECRET`, shorter expirations, and refresh tokens if needed
- HTTPS, secure cookies, CSRF for web (if using cookies instead of Authorization header)
