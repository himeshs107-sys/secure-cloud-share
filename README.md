# VaultShare — Full Stack Setup

Secure cloud file-sharing app with React frontend + Node.js/Express backend + MongoDB.

---

## Project Structure

```
vaultshare/
├── frontend/    ← React + Vite (port 5173)
└── backend/     ← Node.js + Express (port 5000)
```

---

## Quick Start

### Step 1 — Backend

```bash
cd backend
npm install
```

Create `.env` file inside `backend/` folder:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/vaultshare
JWT_SECRET=vaultshare_jwt_super_secret_key_2024
JWT_EXPIRES_IN=7d
AES_SECRET=vaultshare_aes_key_32chars_exact!
UPLOAD_DIR=uploads
MAX_FILE_SIZE_MB=50
FRONTEND_URL=http://localhost:5173
```

Seed the database with default users:

```bash
npm run seed
```

Start the backend:

```bash
npm run dev
```

Backend runs at → **http://localhost:5000**

---

### Step 2 — Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at → **http://localhost:5173**

---

## Everything is real-time

- Upload files → AES-256 encrypted on server
- Share files → unique token-based links with expiry, password, download limits
- All stats on Dashboard → live from MongoDB
- User management → stored and managed in real DB
- Access logs → every action recorded
