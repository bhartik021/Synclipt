# Synclipt

**The fastest way to get text from one device to another.**

You're on your laptop and need to send a snippet to your phone. You open Synclipt, paste it, and get a 6-character code. Type that code on your phone and it's there — instantly. No account, no email, no install.

---

## How it works

1. Go to the app and paste any text (or drop a file)
2. Pick how long it should last — 1 hour to 30 days, or burn after the first view
3. Share the 6-character code, a link, or a QR code with any device
4. Whoever opens it sees the content live — edits appear in real time, like Google Docs but for clipboard

That's it. The default use case takes about 10 seconds.

---

## What you can do with it

**Create a clipboard**
- Paste text, code, markdown — anything, or drop a file
- Optionally set a password so only the person who knows it can view it
- Toggle "Burn after read" and it self-destructs after the first person opens it
- Toggle "Discoverable" to make it searchable by anyone (off by default — all clipboards are private)
- The creator gets a delete token stored in their browser — only they can delete the clipboard; everyone else's delete button is hidden

**Share it**
- 6-character code — type it anywhere
- Direct link — paste in chat, email, anywhere
- QR code — scan from another device without typing

**View a clipboard**
- Content updates live as the creator edits — no refresh needed
- Syntax highlighted for 16 languages (JavaScript, Python, SQL, YAML, etc.)
- Markdown renders as formatted text if the content is Markdown
- One-click copy to clipboard
- Download as a file

**Files**
- Upload images, PDFs, ZIPs, Word docs — up to 50 MB
- Same code/link/QR sharing, same expiry rules
- File is deleted from disk when the clipboard expires or you delete it

**Find clipboards**
- Search tab on the Retrieve page — searches all clipboards marked Discoverable by content or by code
- Your private clipboards never appear, even in search

**Analytics**
- Every clipboard has a `/analytics` page showing daily views over time
- IP addresses are hashed before storage — only used for counting, never stored raw

**Mobile app**
- React Native app in the `mobile/` folder — works on iOS and Android
- Same backend, same API, same features

---

## Running it locally

### What you need installed first

- **Python 3.11+** — for the Django backend
- **Node.js 18+** — for the React frontend
- **PostgreSQL** — the database
- **Redis** — powers the live sync (WebSockets run through it)

### Step 1 — Clone the repo

```bash
git clone https://github.com/your-username/synclipt.git
cd synclipt
```

### Step 2 — Configure environment variables

Create a file called `.env` in the root of the repo. Minimum config to get running locally:

```env
SECRET_KEY=any-random-string-for-development
DEBUG=True
DB_NAME=synclipt
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
REDIS_URL=redis://localhost:6379/0
REDIS_HOST=localhost
REDIS_PORT=6379
```

See the full list of variables at the bottom of this file.

### Step 3 — Start the backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # on Windows: venv\Scripts\activate

pip install pip-tools
pip-compile requirements.in     # creates requirements.txt from requirements.in
pip-sync requirements.txt

python manage.py migrate        # sets up the database tables
python manage.py runserver 0.0.0.0:8000
```

The backend is now running at `http://localhost:8000`.

Binding to `0.0.0.0` (instead of `127.0.0.1`) lets your phone and other devices on the same Wi-Fi reach it — useful for testing real-time sync across devices.

### Step 4 — Start Redis

```bash
redis-server
```

Redis must be running for live sync to work. If it's not running, creating clipboards still works but changes won't appear on other devices in real time.

### Step 5 — Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000/synclipt/** in your browser.

Vite prints two URLs when it starts:
```
  ➜  Local:   http://localhost:3000/
  ➜  Network: http://192.168.1.x:3000/
```

The Network URL is what your phone needs. Open it on your phone and you can test real-time sync across two devices.

### Step 6 — Start Celery (optional)

Celery handles background cleanup — deleting expired clipboards and files. If you skip this, expired clipboards stay in the database until manually deleted, but everything else works fine.

```bash
cd backend
source venv/bin/activate
celery -A synclipt worker --loglevel=info
celery -A synclipt beat --loglevel=info
```

Run both commands (in separate terminals). Beat is the scheduler; worker is the process that does the actual work.

### Step 7 — Mobile app (optional)

```bash
cd mobile
npm install
npx expo start
```

Create a `mobile/.env` file with:
```env
EXPO_PUBLIC_API_URL=http://192.168.1.x:8000/api
```

Replace `192.168.1.x` with your machine's local IP (shown by Vite when you start the frontend).

---

## Running with Docker

If you'd rather not install PostgreSQL and Redis manually, Docker Compose starts everything at once:

```bash
docker-compose up --build
```

| What | URL |
|---|---|
| App | http://localhost/synclipt/ |
| Backend API | http://localhost:8000 |
| Django admin | http://localhost:8000/admin |

This starts: PostgreSQL 16, Redis, the Django backend (via Daphne), two Celery processes, and the React frontend behind Nginx.

---

## Testing that everything works

Once the backend, Redis, and frontend are running:

1. Open `http://localhost:3000/synclipt/` and create a clipboard with some text
2. Copy the share link
3. Open the link in a **different browser tab or incognito window**
4. Go back to the first tab and edit the text — it should appear in the second tab as you type
5. Delete it from one tab — the other tab should redirect to the home page immediately

To test across devices: open the Network URL from your phone, create a clipboard, and open it on your laptop. Edit from either device and watch the other update live.

---

## How the live sync works (for developers)

Every clipboard page opens a WebSocket connection to `ws://localhost:8000/ws/clipboard/{CODE}/`.

When you type, the frontend debounces your keystrokes (400ms) and sends a `clipboard.update` event over the socket. The Django backend writes the new content to the database and broadcasts a `clipboard.updated` event to every other client connected to the same code. They update their display immediately.

For conflict-free collaborative editing, there's a second channel at `ws://localhost:8000/ws/yjs/{CODE}/` that uses [yjs](https://yjs.dev) CRDTs. Each edit is sent as a binary yjs update. The server stores every update and replays the full history to anyone who connects later, so they always see the latest merged state regardless of when they joined.

---

## Project structure

```
Synclipt/
├── .env                        # your local config (not committed to git)
├── docker-compose.yml
├── .github/workflows/ci.yml    # runs tests and build on every push
│
├── backend/
│   ├── synclipt/               # Django project: settings, URLs, ASGI config, Celery
│   ├── clipboard/              # the main app: models, views, WebSocket consumers,
│   │                           #   yjs consumer, search, analytics, background tasks
│   ├── files/                  # file upload/download/expiry
│   ├── utils/                  # shared helpers and API response messages
│   ├── requirements.in         # direct dependencies — edit this one
│   └── requirements.txt        # generated by pip-compile — don't edit directly
│
├── frontend/src/
│   ├── pages/                  # one file per page: Home, Create, Retrieve,
│   │                           #   ClipboardDetail, Analytics, Files, Settings
│   ├── components/             # reusable UI pieces, organized by feature
│   ├── hooks/                  # useClipboard, useWebSocket, useYjs, usePublicIP
│   ├── api/                    # all API calls in one place (clipboard.js, files.js)
│   ├── context/                # ThemeContext (light/dark/system)
│   └── utils/                  # helpers, constants
│
└── mobile/                     # React Native (Expo) app
    ├── App.js                  # navigation setup
    └── src/
        ├── screens/            # HomeScreen, RetrieveScreen, ClipboardDetailScreen
        ├── api/clipboard.js    # same API calls, wrapped for React Native
        └── utils/format.js     # date/expiry formatting
```

---

## API reference

### Clipboard endpoints

| Method | Path | What it does |
|---|---|---|
| `POST` | `/api/clipboard/` | Create a new clipboard |
| `GET` | `/api/clipboard/{code}/` | Get clipboard content (also records a view) |
| `PUT` | `/api/clipboard/{code}/` | Update the content |
| `DELETE` | `/api/clipboard/{code}/` | Delete it permanently (requires `X-Delete-Token` header — issued to the creator at create time) |
| `POST` | `/api/clipboard/{code}/verify-password/` | Unlock a password-protected clipboard |
| `GET` | `/api/clipboard/search/?q=your+query` | Search discoverable clipboards by content or code |
| `GET` | `/api/clipboard/{code}/analytics/` | Get daily view counts for a clipboard |

### File endpoints

| Method | Path | What it does |
|---|---|---|
| `POST` | `/api/files/upload/` | Upload a file (max 50 MB) |
| `GET` | `/api/files/{id}/` | Get file info (name, size, expiry) |
| `GET` | `/api/files/{id}/download/` | Download the file |
| `DELETE` | `/api/files/{id}/` | Delete the file |

### WebSocket channels

**Live sync:** `ws://{host}/ws/clipboard/{CODE}/`

The server sends these events to the client:

| Event | When |
|---|---|
| `connection.established` | You just connected |
| `clipboard.updated` | Someone changed the content |
| `clipboard.deleted` | Someone deleted it |
| `clipboard.expired` | It expired |
| `device.count` | The number of viewers changed |

The client sends:

| Event | What it does |
|---|---|
| `clipboard.update` | Saves new content and broadcasts to all viewers |
| `ping` | Keepalive check — server responds with `pong` |

**CRDT sync:** `ws://{host}/ws/yjs/{CODE}/`

Binary-only channel. Each message is a raw yjs update (a `Uint8Array`). The server stores every update and replays the full history on connect.

---

## CI/CD

Every push and pull request to `master` runs two jobs via GitHub Actions (see `.github/workflows/ci.yml`):

- **Backend** — activates the venv, runs `manage.py migrate` and `manage.py test` against an in-memory SQLite database with a Redis service container
- **Frontend** — runs `npm ci` and `vite build`

---

## Tech stack

| | |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion, React Query, Recharts, yjs |
| Backend | Django 4.2, Django REST Framework, Django Channels, Whitenoise |
| Database | PostgreSQL 16 |
| Cache / message broker | Redis |
| Real-time | WebSockets via Django Channels + Redis channel layer |
| Task queue | Celery + Celery Beat |
| Mobile | React Native, Expo |
| CI | GitHub Actions |
| Deployment | Docker Compose, Daphne (ASGI server), Nginx |

---

## Environment variables

All of these go in the `.env` file at the root of the repo.

| Variable | Default | What it's for |
|---|---|---|
| `SECRET_KEY` | required | Django's cryptographic signing key — use any long random string locally |
| `DEBUG` | `True` | Set to `False` in production; enables verbose errors and relaxed CORS in dev |
| `ALLOWED_HOSTS` | `*` | Comma-separated hostnames Django will serve — restrict in production |
| `DB_NAME` | `synclipt` | PostgreSQL database name |
| `DB_USER` | `postgres` | PostgreSQL username |
| `DB_PASSWORD` | `postgres` | PostgreSQL password |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `REDIS_URL` | `redis://localhost:6379/0` | Full Redis connection string |
| `REDIS_HOST` | `localhost` | Redis hostname (used separately by Celery config) |
| `REDIS_PORT` | `6379` | Redis port |
| `CORS_ALLOWED_ORIGINS` | — | Allowed frontend origins in production (ignored when `DEBUG=True`) |
| `MAX_UPLOAD_SIZE` | `52428800` | Max file upload size in bytes — default is 50 MB |

---

MIT License
