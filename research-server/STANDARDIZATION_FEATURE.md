# Actor Standardization Feature

A comprehensive system for managing actor name standardizations in the timeline.

## Status: Phase 1 Complete ✅ (All Tests Passing)

### Implemented Components

#### 1. Database Schema (`server/schema/standardization.sql`)
- `actor_standardizations`: Canonical actor names
- `actor_aliases`: Alias mappings
- `standardization_applications`: Application history/audit log
- `standardization_suggestions`: Auto-detected duplicates for review
- `actor_usage_cache`: Performance optimization

#### 2. Service Layer (`server/services/standardization_service.py`)
Complete Python service with:
- CRUD operations for actors and aliases
- Suggestion management
- Application history tracking
- Stats and analytics
- Import/Export from Python dicts
- Transaction support

#### 3. API Routes (`server/routes/standardization.py`)
Flask Blueprint with RESTful endpoints:

**Actors:**
- `GET /api/standardization/actors` - List with pagination/filtering
- `POST /api/standardization/actors` - Create new
- `GET /api/standardization/actors/{id}` - Get details with aliases
- `PUT /api/standardization/actors/{id}` - Update
- `DELETE /api/standardization/actors/{id}` - Delete (cascades)

**Aliases:**
- `POST /api/standardization/actors/{id}/aliases` - Add alias
- `DELETE /api/standardization/aliases/{id}` - Remove alias

**Suggestions:**
- `GET /api/standardization/suggestions` - Get pending/approved/rejected
- `POST /api/standardization/suggestions/{id}/review` - Approve/reject

**History:**
- `GET /api/standardization/history` - View application history

**Stats:**
- `GET /api/standardization/stats` - Dashboard statistics

**Import/Export:**
- `POST /api/standardization/import` - Import from dict
- `GET /api/standardization/export` - Export as dict

## Integration

### 1. Register Blueprint in Flask App

```python
from routes.standardization import standardization_bp

app = Flask(__name__)
app.register_blueprint(standardization_bp)
```

### 2. Import Existing Rules

You can import the standardization rules from `scripts/standardize-actors.py`:

```python
from services.standardization_service import StandardizationService

# Read the ACTOR_STANDARDIZATIONS dict from your script
ACTOR_STANDARDIZATIONS = {
    'trump administration': 'Trump Administration',
    'fbi': 'FBI',
    # ... etc
}

service = StandardizationService('unified_research.db')
stats = service.import_from_dict(
    standardizations=ACTOR_STANDARDIZATIONS,
    category='imported',
    source='standardize-actors.py'
)

print(f"Imported {stats['actors_created']} actors, {stats['aliases_created']} aliases")
```

### 3. API Usage Examples

**Create an actor:**
```bash
curl -X POST http://localhost:5000/api/standardization/actors \
  -H "Content-Type: application/json" \
  -d '{
    "canonical_name": "Peter Thiel",
    "category": "Person",
    "description": "Tech investor, Palantir co-founder"
  }'
```

**Add an alias:**
```bash
curl -X POST http://localhost:5000/api/standardization/actors/1/aliases \
  -H "Content-Type: application/json" \
  -d '{
    "alias_name": "peter-thiel",
    "source": "manual"
  }'
```

**List all actors:**
```bash
curl "http://localhost:5000/api/standardization/actors?category=Person&page=1&limit=20"
```

**Get stats:**
```bash
curl http://localhost:5000/api/standardization/stats
```

## Next Steps (Not Yet Implemented)

### Phase 2: Analysis Engine
- Duplicate detection algorithms
- Auto-generate suggestions
- Categorization logic

### Phase 3: Application Engine
- Apply standardizations to event files
- Dry-run previews
- Batch operations with rollback
- Git integration

### Phase 4: Frontend UI
- React components for actor management
- Duplicate detection interface
- Application wizard
- History viewer

### Phase 5: Advanced Features
- Scheduled analysis
- Bulk import/export
- Actor relationship mapping

## Testing

Run the test script to verify the installation:

```bash
cd research-server/server
python3 test_standardization.py
```

## Database Setup

The database tables will be created automatically when the service is first instantiated. The schema is loaded from `server/schema/standardization.sql`.

To manually initialize:

```bash
sqlite3 unified_research.db < server/schema/standardization.sql
```

## Architecture Benefits

1. **Separation of Concerns**: Service layer separate from API routes
2. **Transaction Safety**: All operations wrapped in transactions
3. **Audit Trail**: Complete history of all standardizations
4. **Reversible**: Can track and potentially revert changes
5. **Extensible**: Easy to add new features
6. **API-First**: Can be used by scripts, UI, or other tools

## Example Workflow

1. Import existing rules from scripts
2. Use API to browse actors and aliases
3. Add new actors/aliases as needed
4. Export updated rules back to scripts
5. (Future) Use analysis engine to find duplicates
6. (Future) Apply standardizations to timeline events
7. (Future) View history and revert if needed

## Files Created

```
research-server/
├── server/
│   ├── schema/
│   │   └── standardization.sql          # Database schema
│   ├── services/
│   │   └── standardization_service.py   # Business logic
│   └── routes/
│       └── standardization.py           # API endpoints
└── STANDARDIZATION_FEATURE.md           # This file
```
