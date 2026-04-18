# Axon — Where Ideas Flow 🧠

A smart all-in-one study companion with **notes**, **version control**, **wikilinks**, **knowledge graph**, **daily planner**, and **course management**.

---

## ✨ Features

| Feature | Details |
|---|---|
| 📝 Notes | Create, edit, delete with markdown support |
| 🔁 Version Control | Every edit saves a snapshot — restore any version |
| 🔗 Wikilinks | `[[Note Title]]` links notes together automatically |
| 🕸 Knowledge Graph | Interactive React Flow graph of all connections |
| 🔍 Full-text Search | Debounced search across title + content |
| 🎨 Theme System | Light/Dark mode, no flash on reload |
| 📅 Daily Planner | Plan and track your day |
| 📚 Courses | Manage courses, semesters, and resources |

---

## 🗂 Folder Structure

```
Axon/
├── api/                     # Node.js + Express backend (serverless on Vercel)
│   ├── config/              # db.js — MongoDB connection
│   ├── controllers/         # noteController, versionController, linkController
│   ├── models/              # Note.js — Mongoose schema
│   ├── routes/              # noteRoutes.js
│   ├── utils/               # linkParser.js
│   ├── seed.js              # Sample data seeder (dev only)
│   └── index.js             # Express app entry point
│
├── src/                     # React + Vite frontend
│   ├── api/                 # Axios API layer
│   ├── components/          # Navbar, Sidebar, Editor, Features, etc.
│   ├── context/             # ThemeContext
│   ├── pages/               # All page components
│   └── styles/              # variables.css, global.css
│
├── public/                  # Static assets (Logo, images)
├── index.html               # HTML entry point
├── vite.config.js           # Vite config (proxies /api → localhost:5000 in dev)
└── vercel.json              # Vercel deployment config
```

---

## ⚙️ Local Setup

### Prerequisites
- Node.js 20+
- (Optional) MongoDB local instance — the app uses an in-memory MongoDB automatically if `MONGO_URI` is not set

### 1. Install dependencies

```bash
# Root (frontend)
npm install

# Backend
npm install --prefix api
```

### 2. Configure environment (optional for local dev)

The backend works out-of-the-box locally using an **in-memory MongoDB** — no setup needed.

To use a real local or Atlas database, create `api/.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/axon
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### 3. Start development servers

```bash
npm run dev
```

This starts both the frontend (`http://localhost:5173`) and backend (`http://localhost:5000`) concurrently.

### 4. Seed sample data (optional)

```bash
node api/seed.js
```

---

## 🌐 API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/notes` | List all notes |
| POST | `/api/notes` | Create note |
| GET | `/api/notes/:id` | Get note by ID |
| PUT | `/api/notes/:id` | Update note (auto-saves version) |
| DELETE | `/api/notes/:id` | Delete note |
| GET | `/api/notes/search?q=` | Full-text search |
| GET | `/api/notes/:id/versions` | Version history |
| POST | `/api/notes/:id/restore/:idx` | Restore a version |
| GET | `/api/notes/:id/links` | Outgoing wikilinks |
| GET | `/api/notes/:id/backlinks` | Incoming backlinks |
| GET | `/api/notes/graph` | Graph nodes + edges |
| GET | `/api/health` | Health check |

---

## 🛠 Tech Stack

- **Frontend**: React 19, Vite 8, React Router v7, React Flow, react-markdown, Lucide Icons, Axios
- **Backend**: Node.js 20, Express 5, Mongoose 9
- **Database**: MongoDB (Atlas for production, in-memory for local dev)
- **Deployment**: Vercel (serverless)

---

## 🚀 Vercel Deployment

### 1. Get a MongoDB Atlas URI

1. Create a free cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. **Network Access → Add IP → Allow from anywhere** (`0.0.0.0/0`) — required for Vercel dynamic IPs
3. Copy the connection string:
   ```
   mongodb+srv://user:password@cluster.mongodb.net/axon?retryWrites=true&w=majority
   ```

### 2. Deploy

**Option A — Vercel CLI:**
```bash
npm i -g vercel
vercel --prod
```

**Option B — GitHub integration (recommended):**
1. Push to GitHub
2. Go to [vercel.com](https://vercel.com) → Import project
3. Add environment variables (see below)
4. Deploy

### 3. Environment Variables (set in Vercel dashboard)

| Variable | Value |
|---|---|
| `MONGO_URI` | Your Atlas connection string |
| `CLIENT_URL` | `https://your-app.vercel.app` (optional) |

`NODE_ENV=production` is automatically set via `vercel.json`.

### 4. Verify

- `https://your-app.vercel.app/api/health` → `{ "status": "OK" }`
- `https://your-app.vercel.app/` → Landing page ✅
