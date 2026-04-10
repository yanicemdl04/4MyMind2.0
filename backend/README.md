# ForMyMind - Backend API

A secure, modular backend for **ForMyMind**, a digital platform for mental well-being tracking and AI-assisted emotional support. Built as part of an academic engineering thesis.

---

## System Architecture

```
                         ┌────────────────────┐
                         │   Frontend (Vite)   │
                         └─────────┬──────────┘
                                   │ HTTPS
                    ┌──────────────▼───────────────────────────┐
                    │          Node.js Express API              │
                    │  Helmet │ CORS │ Rate Limit │ Sanitize    │
                    ├──────────────────────────────────────────┤
                    │           Middleware Layer                 │
                    │  JWT Auth │ RBAC │ Zod Validation │ Errors│
                    ├──────────────────────────────────────────┤
                    │             Feature Modules                │
                    │                                           │
                    │  Auth ─ Journal ─ Mood ─ Exercise         │
                    │  Chatbot ─ Content ─ Analytics            │
                    │  Privacy (GDPR)                           │
                    ├──────────────────────────────────────────┤
                    │             Service Layer                  │
                    │  Prisma │ AI Service │ Cache │ Logger      │
                    │  Encryption │ AI Integration               │
                    └───┬──────────┬──────────┬────────────────┘
                        │          │          │
               ┌────────▼──┐ ┌────▼────┐ ┌───▼──────────────┐
               │ PostgreSQL │ │  Redis  │ │   OpenAI API     │
               │ (mymind_db)│ │ (cache) │ │   (GPT-4/CBT)   │
               └────────────┘ └─────────┘ └──────────────────┘
                                                   │
                                          ┌────────▼─────────┐
                                          │  Python FastAPI   │
                                          │  AI Microservice  │
                                          │                   │
                                          │  • Wellbeing ML   │
                                          │  • Sentiment NLP  │
                                          │  • scikit-learn   │
                                          │  • TextBlob       │
                                          └──────────────────┘
```

### Data Flow: Node.js ↔ Python AI Service

```
User Request → Node.js API → Analytics Service
                                    │
                           ┌────────▼────────┐
                           │ AI Integration   │
                           │ Service          │
                           │                  │
                           │  POST /predict/  │──→ Python FastAPI
                           │    wellbeing     │       │
                           │                  │       ├─ Mood analysis (numpy)
                           │  POST /analyze/  │       ├─ Sentiment NLP (TextBlob)
                           │    sentiment     │       └─ Activity scoring
                           └────────┬────────┘
                                    │
                           Fallback to Node.js
                           wellbeing algorithm
                           if AI service unavailable
```

### Folder Structure

```
backend/
├── src/
│   ├── config/              # Environment validation (Zod)
│   ├── lib/
│   │   ├── prisma.ts        # Database client (singleton)
│   │   ├── openai.ts        # OpenAI client
│   │   ├── ai.service.ts    # OpenAI chat + analysis
│   │   ├── ai.prompts.ts    # CBT prompt engineering
│   │   ├── cache.ts         # Cache abstraction (Redis-ready)
│   │   ├── logger.ts        # Structured logging (Pino)
│   │   └── encryption.ts    # AES-256-GCM field encryption
│   ├── middlewares/
│   │   ├── auth.ts          # JWT authentication
│   │   ├── require-role.ts  # RBAC (USER, ADMIN)
│   │   ├── validate.ts      # Zod validation
│   │   ├── sanitize.ts      # XSS input sanitization
│   │   ├── rate-limit.ts    # Rate limiting (global/auth/chatbot/AI)
│   │   └── error-handler.ts # Centralized error handling
│   ├── modules/
│   │   ├── auth/            # Auth + GDPR Privacy endpoints
│   │   ├── journal/         # Personal journal (soft delete)
│   │   ├── mood/            # Mood tracking + anomaly detection
│   │   ├── exercise/        # Wellness exercises
│   │   ├── chatbot/         # AI chatbot (CBT, OpenAI)
│   │   ├── content/         # Educational resources
│   │   └── analytics/       # Wellbeing score + AI prediction
│   │       ├── analytics.service.ts
│   │       └── ai-integration.service.ts  ← Python bridge
│   ├── types/
│   ├── utils/
│   ├── __tests__/
│   └── server.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── Dockerfile
├── docker-compose.yml       # Full stack (postgres + redis + ai + backend)
└── docker-compose.dev.yml   # Dev (postgres + redis + ai with hot reload)

ai-service/                  # Python FastAPI microservice
├── main.py
├── routes/
│   ├── wellbeing.py         # POST /predict/wellbeing
│   └── sentiment.py         # POST /analyze/sentiment
├── services/
│   ├── wellbeing_service.py # ML prediction algorithm
│   └── sentiment_service.py # TextBlob NLP
├── models/
│   └── schemas.py           # Pydantic request/response models
├── tests/
│   └── test_api.py
├── requirements.txt
└── Dockerfile
```

---

## Tech Stack

| Layer            | Technology                          |
|------------------|-------------------------------------|
| Runtime          | Node.js 20+ (TypeScript strict)     |
| Framework        | Express.js 4                        |
| Database         | PostgreSQL 16                       |
| ORM              | Prisma 6                            |
| Validation       | Zod                                 |
| Authentication   | JWT (access + refresh, SHA-256 hash)|
| AI (Chat)        | OpenAI API (GPT-4, CBT prompts)     |
| AI (ML)          | Python FastAPI + scikit-learn       |
| NLP              | TextBlob (sentiment analysis)       |
| Logging          | Pino (structured JSON)              |
| Caching          | In-memory (Redis-ready abstraction) |
| Encryption       | AES-256-GCM (field-level)           |
| Containerization | Docker & Docker Compose             |
| Testing          | Jest + Supertest / pytest           |

---

## Security Model

### Authentication & Token Security

- **Access tokens** (JWT, 15 min): Carry `userId` and `role`
- **Refresh tokens** (JWT, 7 days): Stored as **SHA-256 hash** in DB; rotated on every refresh; revoked on logout
- **Password hashing**: bcrypt, 12 salt rounds
- **Field encryption**: AES-256-GCM available via `encrypt()`/`decrypt()` utilities

### Access Control (RBAC)

```typescript
// Protect admin-only routes:
router.get('/admin/users', authenticate, requireRole('ADMIN'), handler);
```

Roles: `USER` (default), `ADMIN`

### Input Protection

| Layer              | Mechanism                                       |
|--------------------|-------------------------------------------------|
| XSS Prevention     | `sanitizeInput` middleware on all requests       |
| Injection          | Prisma parameterized queries (SQL injection-safe)|
| Validation         | Zod schemas on body, query, params               |
| HTTP Headers       | Helmet (CSP, HSTS, X-Frame-Options)             |
| Rate Limiting      | Global (100/15m), Auth (20/15m), Chatbot (15/m), AI (10/m) |
| CORS               | Configurable origin whitelist + credentials      |

### Data Privacy (GDPR Compliance)

| Endpoint                     | Description                                |
|------------------------------|--------------------------------------------|
| `GET /api/auth/privacy/export`    | Export all user data (Art. 20 portability) |
| `POST /api/auth/privacy/delete`   | Permanent account deletion (Art. 17 erasure)|
| `POST /api/auth/privacy/anonymize`| Anonymize PII, keep aggregated data        |

- All queries filter by `userId` (data isolation)
- Soft delete preserves audit trail before permanent erasure
- Anonymization removes PII but keeps statistical data for research

---

## AI Integration

### 1. Python Microservice (FastAPI)

**Wellbeing Prediction** — `POST /predict/wellbeing`

```json
// Request
{
  "moods": [{"score": 7, "level": "GOOD", "date": "2026-04-01"}, ...],
  "journal_texts": ["I feel grateful today...", ...],
  "activities": [{"category": "MEDITATION", "date": "2026-04-01", "duration_min": 15}]
}

// Response
{
  "wellbeing_score": 72.5,
  "risk_level": "low",
  "trend": "improving",
  "breakdown": {
    "mood_component": 70.0,
    "stability_component": 85.0,
    "sentiment_component": 68.5,
    "activity_component": 57.14
  },
  "insights": [
    "Your overall wellbeing is in a healthy range. Keep it up!",
    "Positive trend detected — your wellbeing has been improving recently."
  ]
}
```

**Sentiment Analysis** — `POST /analyze/sentiment`

```json
// Request
{ "text": "I feel anxious about tomorrow's meeting" }

// Response
{ "sentiment": "negative", "score": -0.35, "subjectivity": 0.8 }
```

### 2. Algorithm (Explainable)

The wellbeing score combines 4 weighted components:

| Component       | Weight | Source                     |
|-----------------|--------|----------------------------|
| Mood Average    | 35%    | `avg(scores) / 10 × 100`  |
| Mood Stability  | 15%    | `(1 - σ/4.5) × 100`       |
| Sentiment       | 25%    | TextBlob polarity → 0-100  |
| Activity        | 25%    | `unique_days / 7 × 100`   |

Risk levels: `low` (≥55), `medium` (30-54), `high` (<30) — with sudden-drop detection.

### 3. Resilient Integration

The Node.js backend calls the Python microservice with a 10-second timeout. If the AI service is unavailable, it **falls back** to the built-in Node.js wellbeing algorithm, ensuring zero downtime.

---

## API Endpoints

All prefixed with `/api`. Consistent response format:

```json
{ "success": true, "data": { ... } }
{ "success": false, "error": "message", "details": [...] }
```

| Module       | Method | Endpoint                           | Auth | Rate Limit |
|--------------|--------|------------------------------------|------|------------|
| Health       | GET    | `/api/health`                      | No   | Global     |
| **Auth**     | POST   | `/api/auth/register`               | No   | Auth (20)  |
|              | POST   | `/api/auth/login`                  | No   | Auth (20)  |
|              | POST   | `/api/auth/logout`                 | Yes  | Global     |
|              | POST   | `/api/auth/refresh-token`          | No   | Global     |
|              | GET    | `/api/auth/profile`                | Yes  | Global     |
|              | PUT    | `/api/auth/profile`                | Yes  | Global     |
| **Privacy**  | GET    | `/api/auth/privacy/export`         | Yes  | Global     |
|              | POST   | `/api/auth/privacy/delete`         | Yes  | Global     |
|              | POST   | `/api/auth/privacy/anonymize`      | Yes  | Global     |
| **Journal**  | POST   | `/api/journal`                     | Yes  | Global     |
|              | GET    | `/api/journal`                     | Yes  | Global     |
|              | GET    | `/api/journal/:id`                 | Yes  | Global     |
|              | PUT    | `/api/journal/:id`                 | Yes  | Global     |
|              | DELETE | `/api/journal/:id`                 | Yes  | Global     |
| **Mood**     | POST   | `/api/mood`                        | Yes  | Global     |
|              | GET    | `/api/mood`                        | Yes  | Global     |
|              | GET    | `/api/mood/stats?range=7days`      | Yes  | Global     |
|              | GET    | `/api/mood/:id`                    | Yes  | Global     |
|              | PUT    | `/api/mood/:id`                    | Yes  | Global     |
|              | DELETE | `/api/mood/:id`                    | Yes  | Global     |
| **Exercise** | POST   | `/api/exercise`                    | Yes  | Global     |
|              | GET    | `/api/exercise`                    | Yes  | Global     |
|              | GET    | `/api/exercise/stats`              | Yes  | Global     |
|              | GET    | `/api/exercise/recommendations`    | Yes  | Global     |
|              | GET    | `/api/exercise/:id`                | Yes  | Global     |
|              | PUT    | `/api/exercise/:id`                | Yes  | Global     |
|              | DELETE | `/api/exercise/:id`                | Yes  | Global     |
|              | POST   | `/api/exercise/log`                | Yes  | Global     |
| **Chatbot**  | POST   | `/api/chatbot/message`             | Yes  | Chat (15)  |
|              | GET    | `/api/chatbot/history`             | Yes  | Global     |
|              | DELETE | `/api/chatbot/history`             | Yes  | Global     |
|              | GET    | `/api/chatbot/recommendations`     | Yes  | Global     |
|              | POST   | `/api/chatbot/analyze`             | Yes  | Chat (15)  |
| **Content**  | GET    | `/api/content`                     | Yes  | Global     |
|              | GET    | `/api/content/recommended`         | Yes  | Global     |
|              | GET    | `/api/content/type/:type`          | Yes  | Global     |
|              | GET    | `/api/content/:id`                 | Yes  | Global     |
|**Analytics** | GET    | `/api/analytics/user-patterns`     | Yes  | Global     |
|              | GET    | `/api/analytics/wellbeing-score`   | Yes  | Global     |
|              | GET    | `/api/analytics/ai-prediction`     | Yes  | AI (10)    |
|              | GET    | `/api/analytics/ai-health`         | Yes  | Global     |

---

## Setup

### Prerequisites

- Node.js >= 20
- Python >= 3.12
- Docker & Docker Compose

### Quick Start (Development)

```bash
# 1. Start infrastructure
cd backend
docker compose -f docker-compose.dev.yml up -d

# 2. Setup backend
npm install
cp .env.example .env   # configure values
npx prisma migrate dev --name init
npx prisma generate
npm run prisma:seed     # optional sample data
npm run dev

# 3. Start AI service (separate terminal)
cd ../ai-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Full Stack Docker

```bash
cd backend
docker compose up -d
```

This starts PostgreSQL, Redis, the Python AI service, and the Node.js backend.

---

## Testing

### Node.js Backend

```bash
cd backend
npm test                # run tests
npm run test:coverage   # with coverage
```

### Python AI Service

```bash
cd ai-service
pip install -r requirements.txt
pytest tests/ -v
```

---

## Environment Variables

| Variable             | Required | Description                          |
|----------------------|----------|--------------------------------------|
| `DATABASE_URL`       | Yes      | PostgreSQL connection string         |
| `JWT_ACCESS_SECRET`  | Yes      | Access token signing secret          |
| `JWT_REFRESH_SECRET` | Yes      | Refresh token signing secret         |
| `ENCRYPTION_KEY`     | No       | AES-256 field encryption key         |
| `OPENAI_API_KEY`     | No       | OpenAI API key (for chatbot)         |
| `AI_SERVICE_URL`     | No       | Python AI microservice URL           |
| `REDIS_URL`          | No       | Redis connection (falls back to mem) |
| `CORS_ORIGIN`        | No       | Allowed CORS origin                  |

---

## Future Improvements

- **Redis Migration**: Replace in-memory cache with Redis (abstraction layer ready)
- **WebSocket Chat**: Real-time chatbot via Socket.io
- **Admin Dashboard**: RBAC middleware is ready; build admin UI + routes
- **Advanced ML**: Train custom models on anonymized user data
- **Swagger/OpenAPI**: Auto-generate from Zod schemas
- **Kubernetes**: Horizontal scaling with stateless architecture
- **Monitoring**: Prometheus metrics + Grafana dashboards

---

## License

This project is part of an academic engineering thesis and is for educational purposes.
