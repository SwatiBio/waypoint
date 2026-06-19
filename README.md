# Job Application Tracker

A comprehensive, Notion-like job application tracker built with pure HTML, CSS, and JavaScript. No build tools, no backend — just open the file and go.

## Features

- **Dashboard** — Stats cards, charts (status doughnut, category bar, monthly trend)
- **Kanban Board** — Drag-and-drop columns by application status
- **Table View** — Sortable table with column filters
- **Timeline View** — Chronological activity history
- **Skills Plugin System** — 5 built-in generators:
  - Email Template Generator
  - Cover Letter Generator
  - Resume Keyword Optimizer
  - Interview Prep Assistant
  - Career Summary Generator
- **AI Integration (optional)** — Connect your free Google Gemini API key for AI-powered generation with fallback to built-in templates
- **Quick Add** — Floating action button to add jobs instantly
- **Search & Filter** — Search across all fields, filter by category
- **Markdown Notes** — Per-job notes with live preview
- **Settings & Profile** — Editable user profile that powers all generators
- **Export/Import** — Full data backup as JSON (in Settings)
- **Keyboard Shortcuts** — Ctrl+N (new job), Ctrl+F (search), Ctrl+S (export)
- **Light/Dark Theme** — Toggle saved to localStorage
- **Browser Notifications** — Reminders for follow-up dates
- **Customizable Categories** — Add/delete sidebar categories

## How to Run Locally

### Option 1: Direct (easiest)
Open `index.html` in any modern browser. All data is stored in localStorage.

### Option 2: Local server (recommended for full functionality)
Since some features use `fetch()` to load plugin files, a local server is recommended:

```bash
# Using npx (Node.js required)
npx serve .

# Using Python
python3 -m http.server 8000

# Using PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

## Getting Started

1. Open the app
2. Go to **Settings** → fill in your profile (name, skills, experience)
3. Start adding jobs via the **+** button or **Ctrl+N**
4. Use the **Skills** view to generate emails, cover letters, interview prep, etc.
5. Optionally add a **Google Gemini API key** in Settings → AI Integration for AI-powered generation

## AI Integration (Optional)

The app supports free AI-powered content generation via Google Gemini. To enable:

1. Get a free API key from [Google AI Studio](https://aistudio.google.com/apikey)
2. Paste it in **Settings → AI Integration**
3. Toggle AI on — generators will use AI with automatic fallback to templates if the API is unavailable

No API key = all generators still work using built-in smart templates.

## Tech Stack

- **HTML5** — Semantic structure
- **CSS3** — Custom properties, flexbox, animations, light/dark theme
- **JavaScript (ES6+)** — Vanilla JS, localStorage API
- **Chart.js** (CDN) — Dashboard charts
- **Marked.js** (CDN) — Markdown rendering
- **Google Gemini API** (optional) — AI-powered generation
- **No build tools** — Pure client-side application

## Data Storage

All data persists in **localStorage** under these keys:
- `jobTracker_jobs` — All job entries
- `jobTracker_categories` — Custom categories
- `jobTracker_history` — Activity history
- `jobTracker_profile` — User profile
- `jobTracker_settings` — App preferences
- `jobTracker_generatedContent` — Generated emails, letters, etc.
- `jobTracker_skillFeedback` — Thumbs up/down feedback

Export your data anytime from **Settings → Export/Import**.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+N` | New job |
| `Ctrl+F` | Focus search |
| `Ctrl+S` | Export data |

## License

MIT
