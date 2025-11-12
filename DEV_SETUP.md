# Development Setup

This document explains how to run a local development environment that matches the production deployment.

## Quick Start

```bash
# Install root dependencies (express for dev server)
npm install

# Install React viewer dependencies
cd timeline/viewer && npm install && cd ../..

# Build and serve both Hugo and React
npm run dev
```

The development server will be available at:
- **Hugo static site**: http://localhost:8080/
- **React interactive viewer**: http://localhost:8080/viewer
- **Static event pages**: http://localhost:8080/events/

## Commands

### Development

```bash
# Start combined development server (builds if needed)
npm run dev

# Build both Hugo and React
npm run build

# Build Hugo only
npm run build:hugo

# Build React viewer only
npm run build:viewer

# Clean all builds
npm run clean
```

### React Viewer Hot Reload Development

For active React development with hot reload:

```bash
cd timeline/viewer
npm start
```

This runs the React dev server on http://localhost:3000/viewer with hot reloading, but without Hugo integration.

## How It Works

The development server (`dev-server.js`) uses Express to serve:

1. **Hugo static site** at the root path `/`
   - Built with `hugo` command in `hugo-site/`
   - Output to `hugo-site/public/`
   - 21,000+ static event pages for SEO

2. **React viewer** at `/viewer`
   - Built with `npm run build` in `timeline/viewer/`
   - Output to `timeline/viewer/build/`
   - Full interactive experience with filters and search

This matches the production deployment created by `.github/workflows/ci-cd.yml`.

## Why This Setup?

**Production Parity**: Local development matches production deployment exactly, ensuring:
- Navigation between Hugo and React works correctly
- Static URLs (`/events/[id]/`) resolve properly
- ShareDialog static links can be tested
- No surprises when deploying

## Architecture

```
CaptureCascadeTimeline/
├── hugo-site/              # Hugo static site
│   ├── content/
│   │   └── events/         # 21K+ markdown event pages
│   └── public/             # Built static site (git-ignored)
│
├── timeline/
│   └── viewer/             # React interactive viewer
│       ├── src/
│       └── build/          # Built React app (git-ignored)
│
├── dev-server.js           # Combined development server
└── package.json            # Root package with dev scripts
```

## First-Time Setup

```bash
# 1. Install root dependencies
npm install

# 2. Install React viewer dependencies
cd timeline/viewer
npm install
cd ../..

# 3. Build everything (automatic on first 'npm run dev')
npm run build

# 4. Start development server
npm run dev
```

## Rebuilding After Changes

**Hugo content changes:**
```bash
npm run build:hugo
# Dev server auto-detects changes and serves new content
```

**React code changes:**
For quick iteration, use the React dev server:
```bash
cd timeline/viewer
npm start
```

Then rebuild for integrated testing:
```bash
npm run build:viewer
```

## Production Deployment

The GitHub Actions workflow (`.github/workflows/ci-cd.yml`) automatically:
1. Builds Hugo site
2. Builds React viewer
3. Merges them into `combined-site/`
4. Deploys to GitHub Pages

No manual deployment needed - just push to `main`.

## Ports

- **Development Server**: 8080 (combined Hugo + React)
- **React Dev Server**: 3000 (React only, hot reload)
- **Production**: Served via GitHub Pages at your custom domain

## Troubleshooting

### Port 8080 already in use
```bash
lsof -ti:8080 | xargs kill -9
npm run dev
```

### Builds not found
```bash
npm run clean
npm run build
npm run dev
```

### Hugo not installed
```bash
brew install hugo
```

### React build fails
```bash
cd timeline/viewer
rm -rf node_modules package-lock.json
npm install
npm run build
```
