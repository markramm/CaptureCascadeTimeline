# The Capture Cascade Timeline

**Documenting the systematic erosion of democratic institutions through the Capture Cascade framework**

[![CI/CD Status](https://github.com/markramm/CaptureCascadeTimeline/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/markramm/CaptureCascadeTimeline/actions)
[![License: Data](https://img.shields.io/badge/License-CC%20BY--SA%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-sa/4.0/)
[![License: Code](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🔗 [View the Interactive Timeline](https://markramm.github.io/CaptureCascadeTimeline/)

## What is the Capture Cascade?

Democracy doesn't fall gradually—it **cascades**. Each captured institution enables the capture of three more, creating exponential acceleration. This timeline documents thousands of events showing this pattern in action.

### The Pattern:

1. **Capture Oversight** → No one watching
2. **Capture Courts** → No legal recourse
3. **Capture Enforcement** → Selective prosecution
4. **Capture Media** → Public can't see
5. **Cascade Accelerates** → Each enables 3 more

### The Evidence:

- **1970s:** <1 event/year
- **2010s:** 8 events/year
- **2020s:** 100+ events/year

Once you see the cascade pattern, you can't unsee it.

## What's in This Timeline?

- **1,945+ documented events** spanning 1142-2025
- **6,373 verified sources** (court records, official documents, credible reporting)
- **3,606 tags** tracking patterns across nine capture lanes
- **3,585 actors** showing network connections

Every event is sourced. Every pattern is documented. Every claim can be verified.

## How to Use This Timeline

### 🔍 Explore
Browse chronologically or filter by capture lanes to see patterns emerge

### 📊 Analyze
Use the network view to see connections between actors and events

### ✅ Verify
Click any event to see sources and documentation

### 🤝 Contribute
Help validate events or submit new ones with sources

## Project Structure

```
CaptureCascadeTimeline/
├── timeline/
│   ├── data/
│   │   ├── events/          # 1,945+ event files (.json, .md)
│   │   ├── api/             # Generated API files
│   │   └── statistics.md    # Timeline statistics
│   ├── scripts/             # Data generation scripts
│   │   ├── generate.py      # Generate API files
│   │   ├── generate_csv.py  # Generate CSV/JSON exports
│   │   └── validate_events.py
│   ├── viewer/              # React web application
│   │   ├── src/
│   │   ├── public/
│   │   └── package.json
│   └── docs/                # Documentation
├── .github/
│   └── workflows/
│       └── ci-cd.yml        # Automated build and deployment
├── LICENSE-DATA             # CC BY-SA 4.0 for timeline data
├── LICENSE-MIT              # MIT for code
└── README.md
```

## Contributing

We welcome contributions! You can help by:

1. **Validating Events** - Verify sources and fact-check timeline events
2. **Submitting New Events** - Add documented events with reliable sources
3. **Improving Documentation** - Help make the timeline more accessible
4. **Sharing & Discussing** - Spread awareness and join the conversation

### Event Requirements

- **Minimum 2 credible sources** (tier-1 or tier-2)
- **Court documents**, official records, or verified reporting from established outlets
- **Clear date and significance** - explain why it matters
- **Proper formatting** - follow JSON or Markdown event schema

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## How to Fork and Deploy Your Own Timeline

This repository is designed to be easily forkable:

1. **Fork this repository** on GitHub
2. **Enable GitHub Pages** in your fork's settings (Actions → Pages → Source: GitHub Actions)
3. **Push changes** to the `main` branch
4. **GitHub Actions will automatically** generate API files and deploy the viewer

That's it! Your timeline will be available at `https://yourusername.github.io/CaptureCascadeTimeline/`

## Local Development

### Prerequisites
- Python 3.11+
- Node.js 18+
- npm

### Setup

```bash
# Clone the repository
git clone https://github.com/markramm/CaptureCascadeTimeline.git
cd CaptureCascadeTimeline

# Generate API files
cd timeline
pip install pyyaml python-frontmatter requests
python scripts/generate.py --events-dir data/events --output-dir data --all

# Install and run viewer
cd viewer
npm install
npm start
```

The viewer will open at `http://localhost:3000`

## Event Format

Events can be in JSON or Markdown format:

### JSON Format (`.json`)
```json
{
  "id": "2025-01-15--event-slug",
  "date": "2025-01-15",
  "title": "Event Title",
  "summary": "Detailed summary...",
  "importance": 8,
  "tags": ["corruption", "regulatory-capture"],
  "actors": ["Donald Trump", "Company Name"],
  "sources": [
    {
      "url": "https://example.com/article",
      "title": "Article Title",
      "publisher": "Publisher Name",
      "date": "2025-01-15",
      "tier": 1
    }
  ]
}
```

### Markdown Format (`.md`)
```markdown
---
id: 2025-01-15--event-slug
date: 2025-01-15
title: Event Title
importance: 8
tags:
  - corruption
  - regulatory-capture
actors:
  - Donald Trump
  - Company Name
sources:
  - url: https://example.com/article
    title: Article Title
    publisher: Publisher Name
    date: 2025-01-15
    tier: 1
---

Detailed summary paragraph describing what happened and why it matters.
```

See [timeline/docs/EVENT_FORMAT.md](timeline/docs/EVENT_FORMAT.md) for complete documentation.

## Technology Stack

- **Frontend**: React 18, D3.js, Framer Motion, date-fns
- **Build & Deploy**: GitHub Actions, GitHub Pages
- **Data Processing**: Python 3.11, PyYAML
- **Data Format**: JSON + Markdown (dual format support)

## License

- **Timeline Data**: [CC BY-SA 4.0](LICENSE-DATA) - Attribution-ShareAlike
- **Source Code**: [MIT License](LICENSE-MIT) - Free to use and modify

## Acknowledgments

This timeline stands on the shoulders of investigative journalists, researchers, and whistleblowers who have documented these events. Every source is cited. Every pattern is traceable.

## Disclaimer

This timeline documents publicly available information from credible sources. While we strive for accuracy, events may contain errors or require updates as new information emerges. All events are sourced and can be independently verified. This is a living document maintained by the community.

---

**"Those who would destroy democracy depend on our ignorance. This timeline is our defense."**
