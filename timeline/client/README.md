# Capture Cascade Timeline (Client)

The visual frontend for the **Capture Cascade** investigative timeline. Built with React, Vite, and D3.js.

## Overview
This application is a **local-first** timeline explorer designed for investigative journalists. It loads a static dataset (from `timeline/data`) into an in-browser database (IndexedDB) to enable performant filtering, searching, and visualization of thousands of interconnected events without backend latency.

## Key Features
-   **Timeline View**: Chronological list of events.
-   **Network Graph**: Force-directed graph of actors and events (D3.js).
-   **Matrix View**: Adjacency matrix for dense connection analysis.
-   **Validation System**: Visual indicators of trust/verification status.
-   **Local-First**: All data runs in-browser via Dexie.js (IndexedDB wrapper).

## Tech Stack
-   **Framework**: React 18 + TypeScript + Vite
-   **State/Data**: Dexie.js (IndexedDB), React Query (implied usage via hooks)
-   **Visualization**: D3.js (Graph, Matrix, Heatmap)
-   **Styling**: Plain CSS (Modular & Scalable)
-   **Testing**: Vitest + React Testing Library

## Getting Started

### Prerequisites
-   Node.js 18+
-   npm 9+

### Installation
```bash
cd timeline/client
npm install
```

### Development
Start the local dev server (default port 5173):
```bash
npm run dev
```

### Building
Build for production (outputs to `dist/`):
```bash
npm run build
```

### Testing
Run unit and component tests:
```bash
npm run test
```

## Project Structure
-   `src/components`: React components (Visualization, Editor, Common)
-   `src/db`: Dexie database schema and loader (`loader.ts`)
-   `src/hooks`: Custom hooks (graph data, resize observer)
-   `src/schemas`: Zod schemas for data validation
-   `src/utils`: Helper functions and graph logic
-   `src/workers`: Web Workers (e.g., validation verification)

## Data Flow
1.  **Loader**: `src/db/loader.ts` fetches `/api/timeline.json`.
2.  **Storage**: Data is bulk-inserted into Dexie (`db.events`).
3.  **Query**: Components use `useLiveQuery` to reactively read from Dexie.
4.  **Visualize**: D3 components (`NetworkGraph`) render the live data.
