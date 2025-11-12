# Testing CaptureCascadeTimeline Integration

## Test: Can research server work with CaptureCascadeTimeline repo?

**Repository**: https://github.com/markramm/CaptureCascadeTimeline.git

### Test Steps:

```bash
# 1. Test GitConfig reads environment variable
cd research-server/server
TIMELINE_REPO_URL='https://github.com/markramm/CaptureCascadeTimeline.git' \
TIMELINE_WORKSPACE='/tmp/cascade-workspace' \
python3 -c "from config import GitConfig; print(f'URL: {GitConfig.TIMELINE_REPO_URL}')"

# 2. Start server with CaptureCascade as data source
TIMELINE_REPO_URL='https://github.com/markramm/CaptureCascadeTimeline.git' \
TIMELINE_WORKSPACE='/tmp/cascade-workspace' \
RESEARCH_MONITOR_PORT=5559 \
python3 app_v2.py

# 3. Test sync from CLI
cd ../cli
TIMELINE_REPO_URL='https://github.com/markramm/CaptureCascadeTimeline.git' \
python3 research_cli.py get-stats
```

### Expected Behavior:

1. Server clones CaptureCascadeTimeline to `/tmp/cascade-workspace`
2. GitSyncer syncs events from `timeline/data/events/`
3. Database populates with ~1,946 events
4. CLI commands work normally

### Current Setup Analysis:

**CaptureCascadeTimeline Repository**:
- Location: `/Users/markr/CaptureCascadeTimeline`
- Remote: `https://github.com/markramm/CaptureCascadeTimeline.git`
- Size: 491MB
- Structure:
  ```
  CaptureCascadeTimeline/
  ├── timeline/
  │   ├── data/events/     # Event files (Markdown + JSON)
  │   ├── viewer/          # React viewer
  │   ├── schemas/
  │   └── scripts/
  ├── hugo-site/           # Static site generator
  └── README.md
  ```

**KleptocracyTimeline Repository**:
- Location: `/Users/markr/kleptocracy-timeline`
- Remote: `https://github.com/markramm/KleptocracyTimeline.git`
- Size: 516MB
- Structure:
  ```
  kleptocracy-timeline/
  ├── timeline/            # Same as CaptureCascade (488MB)
  ├── research-server/     # Research infrastructure (26MB)
  └── research_priorities/ # Research tasks (1.8MB)
  ```

### Current State:

✅ **CaptureCascadeTimeline is already the split!**
- Public timeline repository exists
- Contains timeline data + viewer
- Has Hugo static site
- Successfully deployed to GitHub Pages
- Recent commits show active development

🤔 **But both repos have timeline data**:
- CaptureCascade: 491MB timeline
- Kleptocracy: 488MB timeline
- Likely synchronized manually
- Not using git-based sync yet

### Integration Strategy:

**Option A: Make CaptureCascade the authoritative timeline**
```bash
# Configure research server to use CaptureCascade
export TIMELINE_REPO_URL='https://github.com/markramm/CaptureCascadeTimeline.git'

# Start server - will clone/sync from CaptureCascade
cd research-server/server
TIMELINE_REPO_URL='https://github.com/markramm/CaptureCascadeTimeline.git' \
python3 app_v2.py

# Remove timeline from kleptocracy-timeline repo (optional)
cd ../..
git rm -r timeline/
git commit -m "Timeline moved to CaptureCascadeTimeline repository"
```

**Option B: Keep kleptocracy-timeline authoritative, sync to CaptureCascade**
```bash
# Keep current setup
# Manually sync timeline changes to CaptureCascade for deployment

# Research server uses local filesystem
cd research-server/server
python3 app_v2.py  # Uses default ../../timeline/data/events
```

**Option C: Bidirectional sync (more complex)**
```bash
# Use git submodules or git subtree
# CaptureCascade as submodule in kleptocracy-timeline
git submodule add https://github.com/markramm/CaptureCascadeTimeline.git timeline-public
```

### Recommendation:

**Use Option A** - Make CaptureCascade authoritative:

**Why**:
1. CaptureCascade is already public and deployed
2. GitSyncer architecture was built for this exact use case
3. Separates public timeline from research tools
4. Clean separation of concerns
5. Research server becomes a client of the timeline repo

**Benefits**:
- Single source of truth for timeline data
- Research server can work with any timeline fork
- Easy to onboard contributors (they clone CaptureCascade)
- Kleptocracy repo becomes pure research infrastructure

**Next Steps**:
1. Test integration (run commands above)
2. Verify event count and sync
3. Update kleptocracy-timeline README
4. Optionally remove timeline/ from kleptocracy repo
5. Document new architecture

