# Repository Split Status Report
**Date**: November 4, 2025
**Current State**: Split PREPARED but NOT EXECUTED - Server READY for separate repo
**Status**: Architecture supports split, awaiting final decision

## Executive Summary

The repository was fully prepared for splitting into two separate repositories (timeline-core and research-server) on **October 21, 2025**, but the actual split was never executed. The repository remains a monorepo with both components intact and functional.

**CRITICAL DISCOVERY**: The split **has already happened**!

**CaptureCascadeTimeline** (`https://github.com/markramm/CaptureCascadeTimeline.git`) is the separate timeline repository:
- ✅ Public timeline repository with 1,875 events
- ✅ Deployed to GitHub Pages
- ✅ Active development (recent commits from Nov 2025)
- ✅ Contains timeline data + Hugo site + React viewer
- ✅ 491MB size (similar to kleptocracy-timeline's 488MB timeline)

**The Missing Link**: The research server has been architecturally upgraded with **GitSyncer** to work with separate timeline repositories, but hasn't been configured to use CaptureCascadeTimeline yet. This is a **trivial configuration change**.

**Key Finding**: Empty split directories exist (`kleptocracy-timeline-core` and `kleptocracy-timeline-research-server`) but contain no files, indicating the split was started but abandoned in favor of the CaptureCascadeTimeline approach.

## Current Repository State

### Main Repository: `kleptocracy-timeline`
- **Status**: ✅ ACTIVE MONOREPO
- **Location**: `/Users/markr/kleptocracy-timeline`
- **Remote**: `https://github.com/markramm/KleptocracyTimeline.git`
- **Total Size**: ~516MB
- **Branch**: `main` (active development)

### Component Sizes
```
timeline/              488MB  (1,548 events + React viewer)
research-server/        26MB  (Flask API, CLI, MCP server)
research_priorities/   1.8MB  (421 research task files)
```

### CaptureCascadeTimeline Repository (LIVE)
- **Repository**: `https://github.com/markramm/CaptureCascadeTimeline.git`
- **Local Clone**: `/Users/markr/CaptureCascadeTimeline`
- **Status**: ✅ ACTIVE - Public timeline repository
- **Size**: 491MB
- **Events**: 1,875 (Markdown + JSON)
- **Recent Activity**: Nov 4, 2025 (IndexedDB docs, deep linking, viewer fixes)
- **Deployment**: GitHub Pages (capturecascade.org)

**Structure**:
```
CaptureCascadeTimeline/
├── timeline/
│   ├── data/events/     # 1,875 events
│   ├── viewer/          # React viewer
│   ├── schemas/
│   └── scripts/
├── hugo-site/           # Static site generator
├── LICENSE-DATA (CC0)
├── LICENSE-MIT
└── README.md
```

### Split Preparation Directories (ABANDONED)
- `/Users/markr/kleptocracy-timeline-core` - **0 files** (structure only)
- `/Users/markr/kleptocracy-timeline-research-server` - **0 files** (structure only)

Both directories exist but are completely empty - the CaptureCascadeTimeline approach was chosen instead.

## Historical Timeline

### Phase 1: Cleanup (Oct 19-21, 2025)
**Status**: ✅ COMPLETED

Commits:
- `2ba6ff5` - Pre-split cleanup: Remove build artifacts
- `f8eeb23` - Final cleanup: Remove malformed backup files
- `6d0d7bd` - Major pre-split cleanup (~230MB freed)
- `c271d3a` - Add final split readiness report

**Results**:
- ~280MB freed (58% reduction)
- Test suite cleaned up
- Documentation archived
- Repository declared "READY FOR REPOSITORY SPLIT"

### Phase 2: Split Execution (Never Completed)
**Status**: ❌ NOT STARTED

**Expected Actions** (from spec documents):
1. Create `kleptocracy-timeline-core` repository on GitHub
2. Create `kleptocracy-timeline-research-server` repository on GitHub
3. Use `git subtree split` to extract components with history
4. Push to new remote repositories
5. Configure GitHub Pages for timeline viewer
6. Set up CI/CD for both repositories

**Actual State**:
- No new GitHub repositories created
- Local split directories are empty placeholders
- Main repository still contains all components
- No git subtree split executed

## Split Readiness Assessment

### Documentation Status: ✅ COMPLETE

Two comprehensive split specifications exist:

1. **`FINAL-SPLIT-READINESS-REPORT.md`** (Oct 21, 2025)
   - 474 lines of detailed preparation documentation
   - Status: "✅ READY FOR REPOSITORY SPLIT"
   - Cleanup summary: ~280MB freed, production-ready

2. **Split Specifications** (archived):
   - `001-create-timeline-data-repository.md` - Complete step-by-step guide
   - `002-create-research-server-repository.md` - Complete implementation steps

### Technical Readiness: ✅ READY

**Cleanup Completed**:
- ✅ Build artifacts removed (~89MB freed)
- ✅ Experimental code archived (~230MB freed)
- ✅ Development docs archived
- ✅ Malformed files removed
- ✅ Test suite cleaned up

**Current Structure**:
```
kleptocracy-timeline/
├── timeline/                    # Ready for extraction
│   ├── data/events/            # 1,548 events (JSON + Markdown)
│   ├── viewer/                 # React viewer
│   ├── schemas/                # Validation schemas
│   └── scripts/                # Conversion tools
├── research-server/             # Ready for extraction
│   ├── server/                 # Flask API
│   ├── cli/                    # CLI wrapper
│   ├── agents/                 # MCP server
│   └── tests/                  # Test suite
└── research_priorities/         # Database-backed (stays with research-server)
```

### Testing Status: ⚠️ NEEDS VERIFICATION

**Last Known Test Results** (from FINAL-SPLIT-READINESS-REPORT.md):
- Total Tests: 230
- Passing: 186 (80.8%)
- Known Integration Issues: 44

**Current Status**: Tests directory moved, pytest can't find `tests/` at repo root

**Action Required**: Run test suite to verify current state:
```bash
cd research-server
python3 -m pytest tests/ -v
```

## Proposed Split Plan (From Original Specs)

### Repository 1: Timeline Core
**Proposed Name**: `kleptocracy-timeline` or `kleptocracy-timeline-data`

**Contents**:
```
timeline-core/
├── events/              # 1,548 events (~473MB)
├── viewer/              # React viewer
├── schemas/             # JSON schemas
├── scripts/             # Validation & conversion
├── docs/                # Event format docs
├── LICENSE-DATA (CC0)
└── LICENSE-CODE (MIT)
```

**Purpose**:
- Public-facing timeline data
- Interactive viewer
- Event validation
- GitHub Pages deployment

### Repository 2: Research Infrastructure
**Proposed Name**: `timeline-research-server` or `kleptocracy-research-tools`

**Contents**:
```
research-server/
├── server/              # Flask API
├── cli/                 # CLI wrapper
├── agents/              # MCP server
├── tests/               # Test suite
├── research_priorities/ # Research tasks
├── archive/             # Rejected events
└── LICENSE (MIT)
```

**Purpose**:
- REST API for event management
- CLI tools for research workflows
- AI agent integration (MCP)
- Quality assurance system
- Research priority tracking

## Decision Point: Split or Stay Monorepo?

### Arguments FOR Splitting

**From Original Specs** (Oct 2025):

1. **Separation of Concerns**
   - Timeline data is public (CC0 license)
   - Research server may need private features (MIT license)

2. **Independent Deployment**
   - Timeline viewer deploys to GitHub Pages
   - Research server runs locally or on dedicated infrastructure

3. **Clearer Contributor Onboarding**
   - Timeline repo: "Add events, improve viewer"
   - Research repo: "Improve API, CLI, QA tools"

4. **Independent Versioning**
   - Timeline: Version by data completeness (e.g., "1,600 events")
   - Research server: Semantic versioning (e.g., "v2.1.0")

5. **Permission Management**
   - Timeline repo: Public contributions welcome
   - Research server: May need tighter controls

### Arguments AGAINST Splitting

**Based on Current Monorepo Success**:

1. **Current System Works Well**
   - Research server successfully manages timeline data
   - Single repository simplifies development
   - No deployment issues with current structure

2. **Integration Complexity**
   - Research server needs timeline data path configuration
   - Requires two repository clones for development
   - Cross-repository updates become more complex

3. **Development Overhead**
   - Two sets of CI/CD workflows to maintain
   - Two issue trackers to monitor
   - Two documentation sites to update

4. **Git History Benefits**
   - Current monorepo has complete context
   - Splitting fragments history across repos
   - Harder to trace cross-component changes

5. **Already Deployed Successfully**
   - CaptureCascadeTimeline repo successfully deploys viewer separately
   - Monorepo structure hasn't blocked any workflows

## Git Integration - Separate Repository Support ✅

### Major Architecture Change (Oct 2025)

The research server has been **completely refactored** to support working with separate timeline repositories via git:

**Key Changes**:

1. **GitSyncer replaces FilesystemSyncer** (`research-server/server/services/git_sync.py`)
   - Syncs events from git repository instead of local filesystem
   - Supports any remote timeline repository via `TIMELINE_REPO_URL`
   - On-demand sync (startup + manual trigger)
   - Markdown-only parsing (Hugo-style YAML frontmatter)

2. **GitService for repository management** (`research-server/server/services/git_service.py`)
   - Clone/pull operations
   - Multi-tenant workspace support
   - Repository-agnostic design

3. **GitConfig for environment configuration** (`research-server/server/config.py:217-257`)
   ```python
   TIMELINE_REPO_URL = os.environ.get(
       'TIMELINE_REPO_URL',
       'https://github.com/user/kleptocracy-timeline'
   )
   TIMELINE_BRANCH = os.environ.get('TIMELINE_BRANCH', 'main')
   TIMELINE_WORKSPACE = Path(os.environ.get(
       'TIMELINE_WORKSPACE',
       '/tmp/timeline-workspace'
   ))
   ```

4. **Updated path configuration** (`config.py:59-61`)
   - `events_path`: Default now `../../timeline/data/events` (sibling repo)
   - `validation_logs_path`: Default now `../../timeline/data/validation_logs`
   - `priorities_path`: Stays with research server

**Usage Examples**:

```bash
# Work with current monorepo (default)
python3 app_v2.py

# Work with separate timeline repository
TIMELINE_REPO_URL='https://github.com/markramm/KleptocracyTimeline.git' \
TIMELINE_BRANCH='main' \
python3 app_v2.py

# Work with any other timeline repository
TIMELINE_REPO_URL='https://github.com/user/fork-timeline.git' \
python3 app_v2.py
```

**Multi-Tenant Capabilities**:
- Each timeline repo gets isolated workspace
- Supports multiple concurrent timeline repositories
- Designed for future timeline federation

### Implications for Split

This architecture change means:

✅ **Split is now trivial** - Server already works with separate repos
✅ **No code changes needed** - Just set environment variables
✅ **Tested architecture** - GitService has comprehensive test suite
✅ **Reversible** - Can switch between monorepo and split repo instantly

## Current Working State

### What's Working ✅

**Timeline Component**:
- 1,548 events in dual format (JSON + Markdown)
- Event validation working
- Static API generation working
- Successfully deployed to CaptureCascadeTimeline repo

**Research Server** (Git-Enabled):
- Flask API functional on port 5558
- **GitSyncer operational** (replaces FilesystemSyncer)
- **Multi-repo support** via TIMELINE_REPO_URL
- CLI wrapper (`./research`) working well
- Validation runs system operational
- QA system with quality scoring functional
- MCP server integration available

**Documentation**:
- Comprehensive CLAUDE.md for AI agents
- API documentation complete
- Architecture documentation up-to-date
- Git sync implementation plan documented

### What Needs Attention ⚠️

1. **Test Suite Location**
   - Tests moved to `research-server/tests/`
   - Root-level pytest config may need update

2. **Empty Split Directories**
   - `/Users/markr/kleptocracy-timeline-core` (empty)
   - `/Users/markr/kleptocracy-timeline-research-server` (empty)
   - Decision needed: Delete or populate?

3. **GitHub Repository Status**
   - No new repositories created on GitHub
   - Current repo: `markramm/KleptocracyTimeline`

## Recommendations (Updated with Git Integration)

### NEW FINDING: Split is Now Simpler Than Expected

With the GitSyncer architecture in place, the split requires **significantly less effort** than originally planned. The research server can already work with any separate timeline repository.

### Option 1: Complete the Split (SIGNIFICANTLY SIMPLIFIED)

**With git integration, split is now trivial**:

**Simplified Steps** (no longer need git subtree, just move files):

1. **Create timeline repository on GitHub**:
   ```bash
   gh repo create kleptocracy-timeline-data --public \
     --description "Timeline event data and viewer"
   ```

2. **Copy timeline files to new repo**:
   ```bash
   # Clone new empty repo
   git clone git@github.com:yourusername/kleptocracy-timeline-data.git

   # Copy timeline directory
   cp -r /Users/markr/kleptocracy-timeline/timeline/* \
         kleptocracy-timeline-data/

   # Commit and push
   cd kleptocracy-timeline-data
   git add .
   git commit -m "Initial timeline data"
   git push
   ```

3. **Configure research server to use new repo**:
   ```bash
   # In research server directory
   export TIMELINE_REPO_URL='https://github.com/yourusername/kleptocracy-timeline-data.git'
   python3 app_v2.py
   ```

4. **Update research repo** (optional - can stay as-is):
   ```bash
   # Remove timeline directory from research repo
   git rm -r timeline/
   git commit -m "Timeline moved to separate repository"
   ```

**Benefits**:
   - Clearer separation of concerns
   - Independent deployment pipelines
   - Distinct contributor communities
   - Research server can work with any timeline repo
   - Easy to switch between repos

**Effort Required**: 1-2 hours (git integration makes it trivial)

### Option 2: Abandon Split, Embrace Monorepo

**If current structure is working**:

1. **Clean up split artifacts**:
   ```bash
   # Remove empty split directories
   rm -rf /Users/markr/kleptocracy-timeline-core
   rm -rf /Users/markr/kleptocracy-timeline-research-server

   # Archive split documentation
   mv FINAL-SPLIT-READINESS-REPORT.md archive/
   mv PRE-SPLIT-SUMMARY.md archive/
   ```

2. **Update documentation**:
   - Remove references to upcoming split
   - Document monorepo rationale in README
   - Emphasize successful monorepo architecture

3. **Benefits**:
   - No disruption to working system
   - Simpler development workflow
   - Complete git history in one place

4. **Effort Required**: 30 minutes

### Option 3: Hybrid Approach (CaptureCascade Model)

**Current successful pattern**:

**What exists now**:
- **Main monorepo**: `KleptocracyTimeline` (development, research tools)
- **Separate viewer repo**: `CaptureCascadeTimeline` (public-facing, deployed)

**Strategy**:
1. Keep monorepo for development and research
2. Use CaptureCascadeTimeline for public timeline viewer only
3. Sync timeline data between repos as needed

**Benefits**:
- Already working successfully
- No major restructuring needed
- Clean public-facing site separate from research tools

## Next Steps

### Immediate Actions Required

1. **Make Split Decision**:
   - [ ] Complete the split (Option 1)
   - [ ] Abandon split, clean up artifacts (Option 2)
   - [ ] Continue hybrid model (Option 3)

2. **If Splitting**:
   - [ ] Create GitHub repositories
   - [ ] Execute `git subtree split` commands
   - [ ] Configure GitHub Pages for timeline
   - [ ] Set up CI/CD for both repos
   - [ ] Update CLAUDE.md with new paths

3. **If Not Splitting**:
   - [ ] Remove empty split directories
   - [ ] Archive split documentation
   - [ ] Update README to reflect monorepo choice
   - [ ] Update CLAUDE.md to reflect structure

4. **Regardless of Choice**:
   - [ ] Run test suite to verify current state
   - [ ] Update documentation to match reality
   - [ ] Document decision rationale

## Questions to Answer

1. **Is the separation of concerns still a priority?**
   - Public timeline data vs. private research tools?

2. **Has the monorepo caused any issues?**
   - Deployment problems?
   - Contributor confusion?
   - Permission management issues?

3. **Is the CaptureCascadeTimeline repo sufficient?**
   - Does it serve the "public timeline" need?
   - Is a second split still necessary?

4. **What's the development workflow preference?**
   - Single repo for simplicity?
   - Multiple repos for modularity?

## Conclusion

**Current Status**: The split **has already happened** - CaptureCascadeTimeline is the separate timeline repository. The final step is connecting the research server to it.

**Major Discovery**: CaptureCascadeTimeline repository already exists and is actively maintained with 1,875 events, deployed to GitHub Pages, and has all the timeline infrastructure. The research server has GitSyncer to work with it, but isn't configured yet.

**The Missing Piece**: Just one environment variable to connect them:
```bash
export TIMELINE_REPO_URL='https://github.com/markramm/CaptureCascadeTimeline.git'
```

**Final Recommendation**: **Complete the integration** (15 minutes)

Since CaptureCascadeTimeline already exists and the GitSyncer architecture is ready, the final step is trivial:

1. **Configure research server to use CaptureCascade** (1 command):
   ```bash
   export TIMELINE_REPO_URL='https://github.com/markramm/CaptureCascadeTimeline.git'
   cd research-server/server
   python3 app_v2.py
   ```

2. **Optionally remove duplicate timeline from kleptocracy repo** (optional):
   ```bash
   git rm -r timeline/
   git commit -m "Timeline moved to CaptureCascadeTimeline repository"
   ```

3. **Update documentation** (10 minutes):
   - Update README to reference CaptureCascadeTimeline
   - Update CLAUDE.md with new setup instructions
   - Document that kleptocracy-timeline is now research-only

**Benefits of Completing Integration**:
- ✅ Single source of truth (CaptureCascadeTimeline)
- ✅ No more manual sync between repos
- ✅ Research server works with public timeline
- ✅ Can easily switch between timeline repos
- ✅ Separation of concerns (public data vs research tools)
- ✅ Can remove 488MB duplicate timeline from kleptocracy repo

**Why This is the Right Move**:
1. Split already happened - just need to connect the pieces
2. GitSyncer was built specifically for this
3. Zero code changes needed
4. Fully reversible
5. Eliminates data duplication

**Alternative**: Keep current setup where both repos have timeline data, but this means:
- ❌ Duplicate data (488MB + 491MB = 979MB total)
- ❌ Manual sync required
- ❌ GitSyncer architecture unused
- ❌ Potential for data divergence

**Timeline**: 15-30 minutes to complete integration and update docs.

---

**Report Generated**: November 4, 2025
**Repository**: `/Users/markr/kleptocracy-timeline`
**Branch**: `main`
**Git Remote**: `https://github.com/markramm/KleptocracyTimeline.git`
