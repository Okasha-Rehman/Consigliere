# Consigliere

A daily learning tracker with email/password authentication and a dark theme.

**Features:** Daily check-ins (pages read, videos watched, notes) • Streak tracking • Personal goals • Analytics • Profile pictures

**Tech Stack:** Python 3.11+ / FastAPI • React 18 / Vite • PostgreSQL 15

---

## Quick Start

### Prerequisites

```bash
python3 --version    # Should be 3.11+
node --version       # Should be 18+
psql --version       # Should be 12+
```

### Backend Setup

```bash
# Create virtual environment
python3 -m venv venv && source venv/bin/activate

# Install dependencies
cd backend && pip install -r requirements.txt && cd ..

# Create database
createdb consigliere_dev

# Configure environment
cp env.example .env.dev
# Edit .env.dev - add DATABASE_URL and generate SECRET_KEY:
# python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# Create tables
cd backend && python3 -c "from database import engine; from models import Base; Base.metadata.create_all(bind=engine)" && cd ..

# Start backend
cd backend && uvicorn main:app --reload --port 8000
```

Backend runs on: **http://localhost:8000**

### Frontend Setup

```bash
# Install dependencies
cd frontend && npm install && cd ..

# Start dev server
cd frontend && npm run dev
```

Frontend runs on: **http://localhost:5173**

### Test Application

1. Open http://localhost:5173/dashboard
2. Sign up with email and password
3. Click "Check In" to submit daily progress
4. View analytics on dashboard

---

## Project Structure

```
backend/
  ├── main.py         # API routes
  ├── models.py       # Database models
  ├── database.py     # Database setup
  ├── auth.py         # Authentication
  └── requirements.txt # Dependencies

frontend/
  ├── src/
  │   ├── pages/      # Page components
  │   └── components/ # UI components
  ├── package.json    # Dependencies
  └── vite.config.js  # Build config

docker-compose.yml    # Multi-container setup
env.example           # Environment template
step-by-step-guide.txt# Production deployment guide
```

---

## Environment Variables

Create `.env.dev`:

```
ENV=dev
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/consigliere_dev
SECRET_KEY=<generated-key-here>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
UPLOAD_DIR=/app/uploads
MAX_UPLOAD_SIZE=5242880
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
QUOTE_API_URL=https://api.quotable.io/quotes/random?tags=wisdom
VITE_API_BASE_URL=http://localhost:8000
```

---

Jenkins CICD Automated Test#1.
Jenkins CICD Automated Test#2.
## License

MIT
