# FocusFlow

Personal ADHD + Dyslexia productivity PWA. English only.

## Features

- **Reading support** — paste long text, chunk it, bionic reading mode, text-to-speech
- **Task initiation** — micro-step nudges, single-task focus mode, energy matching
- **Time blindness** — visual timer, elapsed time display, voice announcements every 5 min
- **Writing support** — voice dictation, read-back, save as notes
- **Overwhelm reduction** — brain dump, breathing exercises, daily task limits
- **Accessibility** — OpenDyslexic font, adjustable spacing/sizing, reading guide, 4 themes

## Quick Start

```bash
npm install
npm run dev
```

Then open http://localhost:5173/focusflow/

## Deploy to GitHub Pages

### 1. Create a GitHub repo called `focusflow`

### 2. Push the code

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/focusflow.git
git push -u origin main
```

### 3. Deploy

```bash
npm run deploy
```

This builds and pushes to the `gh-pages` branch automatically.

### 4. Enable GitHub Pages

- Go to your repo → Settings → Pages
- Source: **Deploy from a branch**
- Branch: **gh-pages** / **(root)**
- Save

Your app will be live at: `https://YOUR_USERNAME.github.io/focusflow/`

### 5. Install as PWA

On your phone, open the URL in Chrome/Safari and tap "Add to Home Screen". It works offline.

## Local Development

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
```

## Tech Stack

- React 18
- Vite 5
- No backend — all data stored in localStorage
- PWA with service worker for offline use
- Web Speech API for voice input and text-to-speech

## Customising the base path

If your repo is named something other than `focusflow`, update these files:

1. `vite.config.js` — change `base: '/focusflow/'` to `base: '/your-repo-name/'`
2. `public/manifest.json` — change `start_url` and `scope`
3. `src/main.jsx` — change the service worker path
4. `public/sw.js` — change all `/focusflow/` references
