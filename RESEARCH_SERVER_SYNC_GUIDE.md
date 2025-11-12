# Research Server Database Sync Guide

## Problem
The Research Monitor v2 API server (localhost:5558) contains stale data:
- **API database**: 1,873 events
- **Static files**: 2,816 events (after deduplication)

## Solution
The research server database needs to be synced with the latest event data from the upstream repository.

## Steps to Sync Research Server

### 1. Locate Research Server Code
The Research Monitor v2 API is likely in one of these locations:
- `~/research-monitor-v2/`
- `~/kleptocracy-timeline/research-server/`
- Check running process: `ps aux | grep python | grep 5558`

### 2. Identify Database Location
Find the database file (typically SQLite or PostgreSQL):
```bash
cd /path/to/research-server
find . -name "*.db" -o -name "*.sqlite"
```

### 3. Backup Current Database
```bash
cp timeline.db timeline.db.backup.$(date +%Y%m%d)
```

### 4. Sync from Upstream Repository
The research server should have a sync mechanism. Look for:
- `sync.py` or `import_events.py` script
- CLI command like `python -m research_monitor.sync`
- Admin API endpoint like `/api/admin/sync`

### 5. Manual Sync (if automated sync unavailable)
```bash
# Export events from static files
cd /Users/markr/kleptocracy-timeline/timeline/data/api

# Import to database (example - adjust for your setup)
python scripts/import_timeline.py timeline.json

# Or use SQL import (if SQLite)
sqlite3 timeline.db < import_events.sql
```

### 6. Verify Sync
```bash
# Check event count via API
curl http://localhost:5558/api/timeline/events | jq '. | length'

# Should return: 2816 (or more if new events added)
```

### 7. Re-enable Live API
After successful sync, update viewer configuration:

**File**: `timeline/viewer/src/config.js`
```javascript
// Line 29 - Change from:
const USE_LIVE_API = false;

// To:
const USE_LIVE_API = isDevelopment && !isGitHubPages;
```

## Data Issues Discovered

### Duplicate Events
The source data (`timeline/data/api/timeline.json`) contained 59 duplicate event IDs:
- **Original count**: 2,875 events
- **After deduplication**: 2,816 unique events

**Duplicates included**:
- Nick Fuentes Twitter suspension (appeared 3 times)
- Stephen Miller events
- Palantir and Anduril events
- In-Q-Tel events
- Pam Bondi events
- Russell Vought events

### Deduplication Script
```python
import json

with open('timeline/data/api/timeline.json', 'r') as f:
    events = json.load(f)

print(f"Original events: {len(events)}")

seen_ids = set()
deduped_events = []

for event in events:
    event_id = event.get('id')
    if event_id not in seen_ids:
        seen_ids.add(event_id)
        deduped_events.append(event)

print(f"After deduplication: {len(deduped_events)}")
print(f"Removed {len(events) - len(deduped_events)} duplicates")

with open('timeline/data/api/timeline.json', 'w') as f:
    json.dump(deduped_events, f, indent=2, ensure_ascii=False)
```

**Note**: Since `timeline/data/api/` is git-ignored (generated files), the deduplication needs to be applied to the source data generation process to prevent future duplicates.

## Current Status

### Working Configuration
- **Mode**: Static file fallback
- **Events loaded**: 2,816
- **Proxy**: setupProxy.js serves static files from `../data/api/`
- **Development server**: http://localhost:3000/viewer
- **Warnings**: All React warnings resolved

### Pending
- [ ] Sync research server database with 2,816 events
- [ ] Re-enable live API mode (USE_LIVE_API = true)
- [ ] Fix data generation to prevent future duplicates
- [ ] Complete IndexedDB Phase 6 testing

## Files Modified

### timeline/viewer/src/setupProxy.js (NEW)
Webpack dev server proxy configuration to serve static API files during development.

### timeline/viewer/src/config.js
- Disabled `USE_LIVE_API` (line 29)
- Added TODO comment about updating live API database

### timeline/viewer/src/services/apiService.js
- Added axios configuration with 50MB limits
- Added development mode fallback using fetch()
- Enhanced logging throughout

### timeline/viewer/src/components/EnhancedTimelineView.js
- Fixed React key prop warning on source links (line 643-658)
- Changed conditional rendering to ternary operator

## Testing Checklist

- [x] Static files served correctly via setupProxy.js
- [x] All 2,816 events load in viewer
- [x] No duplicate key warnings in React console
- [x] No missing key prop warnings
- [ ] Research server database synced
- [ ] Live API returns 2,816 events
- [ ] IndexedDB initialization successful with live API
- [ ] Memory usage optimized with IndexedDB
- [ ] Virtual scrolling performance verified

## References

- **setupProxy.js**: `/Users/markr/kleptocracy-timeline/timeline/viewer/src/setupProxy.js`
- **Static API files**: `/Users/markr/kleptocracy-timeline/timeline/data/api/`
- **Timeline data**: `/Users/markr/kleptocracy-timeline/timeline/data/api/timeline.json`
- **Branch**: `indexeddb-optimization`
