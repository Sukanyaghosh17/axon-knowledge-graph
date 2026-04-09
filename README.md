# Axon — Where Ideas Flow 🧠

A production-quality smart notes system with **version control**, **wikilinks**, and an interactive **knowledge graph**.

---

## ✨ Features

| Feature | Details |
|---|---|
| 📝 Notes | Create, edit, delete with markdown support |
| 🔁 Version Control | Every edit saves a snapshot — restore any version |
| 🔗 Wikilinks | `[[Note Title]]` links notes together automatically |
| 🕸 Knowledge Graph | Interactive React Flow graph of all connections |
| 🔍 Full-text Search | Debounced search across title + content |
| 🎨 Theme System | Light/Dark mode, no flash on reload, localStorage persisted |

---

## 🗂 Folder Structure

```
Axon/
├── client/                  # React + Vite frontend
│   ├── src/
│   │   ├── api/             # Axios API layer
│   │   ├── components/      # Navbar, Sidebar, Editor, VersionHistory, Graph
│   │   ├── context/         # ThemeContext
│   │   ├── pages/           # HomePage, GraphPage
│   │   └── styles/          # variables.css, global.css
│   └── vite.config.js
│
└── server/                  # Node.js + Express backend
    ├── config/              # db.js
    ├── controllers/         # noteController, versionController, linkController
    ├── models/              # Note.js
    ├── routes/              # noteRoutes.js
    ├── utils/               # linkParser.js
    ├── seed.js              # Sample data seeder
    └── index.js
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js 18+
- MongoDB (local instance on port 27017, or Atlas URI)

### 1. Clone & install dependencies

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 2. Configure environment

`server/.env` is already pre-configured for local development:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/axon
CLIENT_URL=http://localhost:5173
```
Update `MONGO_URI` if using MongoDB Atlas.

### 3. Seed sample data (optional but recommended)

```bash
cd server
node seed.js
```
This inserts 6 interconnected notes with pre-resolved wikilinks.

### 4. Start the backend

```bash
cd server
npm run dev
```
Server starts at `http://localhost:5000`

### 5. Start the frontend

```bash
cd client
npm run dev
```
App opens at `http://localhost:5173`

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

---

## 🎨 Color Palette

| Token | Light | Dark |
|---|---|---|
| Background | `#F0F7EE` | `#2E3440` |
| Surface | `#FFFFFF` | `#3B4252` |
| Accent | `#5E81AC` | `#88C0D0` |
| Text | `#1A1A1A` | `#ECEFF4` |

---

## 🛠 Tech Stack

- **Frontend**: React 18, Vite, React Router v6, React Flow, react-markdown, Lucide Icons
- **Backend**: Node.js, Express 5, Mongoose
- **Database**: MongoDB

---

## 💡 Usage Tips

1. **Wikilinks**: Type `[[Note Title]]` in any note's content to link it
2. **Graph**: Click **Graph** in the navbar — node size reflects connection count
3. **Version History**: Click **History** button while editing to see all past versions
4. **Auto-save**: Notes save automatically 1.5 seconds after you stop typing
5. **Search**: Use the search bar in the navbar — results update as you type
6. **Tags**: Press `Enter` or `,` in the tag field to add tags; click `×` to remove
