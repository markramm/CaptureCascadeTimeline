# Timeline Validation System Specification

**Version:** 1.0
**Date:** 2024-12-24
**Status:** Draft

## 1. Overview

### 1.1 Purpose

The validation system enables humans and AI agents to record that they have verified specific timeline events, tracking who validated what, when, and how—without polluting the core event data structure.

### 1.2 Design Principles

1. **Git-native**: All validation data stored as JSON files, fully diff-able and PR-reviewable
2. **Decentralized**: Per-validator folders eliminate merge conflicts and enable parallel work
3. **Browser-compatible**: Generated index loads into IndexedDB alongside event data
4. **Trust-flexible**: Users can choose which validators they trust
5. **Separation of concerns**: Validation is overlay data, events remain clean

### 1.3 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Git Repository                            │
├─────────────────────────────────────────────────────────────────┤
│  timeline/data/validations/                                      │
│  ├── validators/                                                 │
│  │   ├── claude-opus-4/           # AI validator folder          │
│  │   │   ├── manifest.json        # Validator metadata           │
│  │   │   └── records/                                            │
│  │   │       ├── 2024-12-24.json  # Day's validation batch       │
│  │   │       └── 2024-12-25.json                                 │
│  │   ├── research-executor-v2/    # Another AI validator         │
│  │   └── human-markr/             # Human validator              │
│  ├── index.json                   # Generated aggregate          │
│  └── schema.json                  # Validation record schema     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ generate.py
┌─────────────────────────────────────────────────────────────────┐
│                    Static API Output                             │
│  timeline/data/api/                                              │
│  ├── timeline.json                # Events (unchanged)           │
│  ├── validations.json             # Validation index for browser │
│  └── stats.json                   # Updated with validation stats│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ HTTP fetch
┌─────────────────────────────────────────────────────────────────┐
│                    Browser Client                                │
│  IndexedDB                                                       │
│  ├── events store                 # Timeline events              │
│  ├── metadata store               # Sync timestamps              │
│  └── validations store            # Validation index (NEW)       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Data Structures

### 2.1 Validator Manifest

Each validator has a `manifest.json` describing their identity and capabilities.

**Location:** `timeline/data/validations/validators/{validator-id}/manifest.json`

```json
{
  "id": "claude-opus-4",
  "type": "ai",
  "name": "Claude Opus 4",
  "description": "Anthropic Claude Opus 4 model performing source and factual verification",
  "created_at": "2024-12-24T00:00:00Z",
  "capabilities": ["source", "factual", "cross-reference"],
  "trust_level": "automated",
  "contact": null,
  "public_key": null
}
```

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier matching folder name |
| `type` | enum | Yes | `ai`, `human`, `automated` |
| `name` | string | Yes | Display name |
| `description` | string | No | What this validator does |
| `created_at` | ISO 8601 | Yes | When validator was registered |
| `capabilities` | array | Yes | Validation types this validator performs |
| `trust_level` | enum | No | `automated`, `reviewed`, `expert` |
| `contact` | string | No | Email or URL for human validators |
| `public_key` | string | No | For cryptographic signing (future) |

**Validator Types:**
- `ai`: AI model (Claude, GPT, etc.)
- `human`: Human researcher
- `automated`: Bot/script (URL checker, date validator)

### 2.2 Validation Record Batch

Validators record their work in date-based batch files.

**Location:** `timeline/data/validations/validators/{validator-id}/records/{date}.json`

```json
{
  "validator_id": "claude-opus-4",
  "batch_id": "2024-12-24-001",
  "created_at": "2024-12-24T15:30:00Z",
  "session_context": "Historical expansion validation pass",
  "validations": [
    {
      "event_id": "1971-08-23--powell-memo-economic-manipulation-blueprint",
      "timestamp": "2024-12-24T15:30:45Z",
      "type": "source",
      "confidence": "high",
      "sources_checked": [
        {
          "url": "https://scholarlycommons.law.wlu.edu/powellmemo/",
          "status": "verified",
          "accessed_at": "2024-12-24T15:30:40Z"
        }
      ],
      "notes": "Primary source verified at Washington & Lee University archives. Full memo text matches event description.",
      "claims_verified": [
        "Powell authored memo on August 23, 1971",
        "Memo addressed to US Chamber of Commerce"
      ]
    },
    {
      "event_id": "2008-09-15--lehman-brothers-bankruptcy",
      "timestamp": "2024-12-24T15:32:10Z",
      "type": "factual",
      "confidence": "high",
      "sources_checked": [],
      "notes": "Date and facts verified against SEC filings and contemporary news coverage."
    }
  ]
}
```

**Batch Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `validator_id` | string | Yes | Must match folder name |
| `batch_id` | string | Yes | Unique batch identifier |
| `created_at` | ISO 8601 | Yes | When batch was created |
| `session_context` | string | No | Description of validation session |
| `validations` | array | Yes | Array of validation records |

**Validation Record Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `event_id` | string | Yes | Timeline event ID being validated |
| `timestamp` | ISO 8601 | Yes | When this validation was performed |
| `type` | enum | Yes | Type of validation performed |
| `confidence` | enum | Yes | Confidence level in validation |
| `sources_checked` | array | No | Sources that were verified |
| `notes` | string | No | Validator notes/observations |
| `claims_verified` | array | No | Specific claims verified |
| `issues_found` | array | No | Problems discovered |
| `suggested_corrections` | object | No | Proposed fixes |

### 2.3 Validation Types

| Type | Description | Typical Validators |
|------|-------------|-------------------|
| `source` | URLs accessible, content matches claims | AI, automated |
| `factual` | Dates, names, numbers are accurate | AI, human |
| `completeness` | No major omissions in coverage | Human |
| `cross-reference` | Corroborated by other timeline events | AI |
| `primary-source` | Verified against original documents | Human |
| `context` | Proper historical context provided | Human, AI |
| `bias` | Checked for balance/neutrality | Human |

### 2.4 Confidence Levels

| Level | Description | Criteria |
|-------|-------------|----------|
| `high` | Strong verification | Primary sources confirmed, multiple corroborations |
| `medium` | Reasonable verification | Secondary sources confirmed, some gaps |
| `low` | Weak verification | Limited sources, some uncertainty |
| `disputed` | Conflicting evidence | Sources contradict each other |
| `failed` | Verification failed | Could not verify, sources broken |

### 2.5 Generated Validation Index

The build system generates an aggregated index for browser consumption.

**Location:** `timeline/data/api/validations.json`

```json
{
  "generated_at": "2024-12-24T16:00:00Z",
  "schema_version": "1.0",
  "summary": {
    "total_events": 3516,
    "validated_events": 1247,
    "unvalidated_events": 2269,
    "validation_records": 2891,
    "validators": {
      "claude-opus-4": {
        "type": "ai",
        "validations": 1823,
        "events_validated": 892
      },
      "research-executor-v2": {
        "type": "ai",
        "validations": 567,
        "events_validated": 312
      },
      "human-markr": {
        "type": "human",
        "validations": 501,
        "events_validated": 289
      }
    },
    "by_confidence": {
      "high": 1456,
      "medium": 892,
      "low": 312,
      "disputed": 45,
      "failed": 186
    },
    "by_type": {
      "source": 1567,
      "factual": 1123,
      "cross-reference": 201
    }
  },
  "events": {
    "1971-08-23--powell-memo-economic-manipulation-blueprint": {
      "validation_count": 3,
      "validators": ["claude-opus-4", "human-markr", "research-executor-v2"],
      "types": ["source", "factual", "primary-source"],
      "confidence": "high",
      "last_validated": "2024-12-24T15:30:45Z",
      "issues": []
    },
    "2008-09-15--lehman-brothers-bankruptcy": {
      "validation_count": 2,
      "validators": ["claude-opus-4", "research-executor-v2"],
      "types": ["source", "factual"],
      "confidence": "high",
      "last_validated": "2024-12-24T15:32:10Z",
      "issues": []
    },
    "2020-01-15--example-disputed-event": {
      "validation_count": 2,
      "validators": ["claude-opus-4", "human-markr"],
      "types": ["source", "factual"],
      "confidence": "disputed",
      "last_validated": "2024-12-23T10:00:00Z",
      "issues": ["Date discrepancy between sources", "Primary source unavailable"]
    }
  }
}
```

---

## 3. File System Structure

```
timeline/data/validations/
├── README.md                           # Documentation
├── schema.json                         # JSON Schema for validation records
├── index.json                          # Generated aggregate (gitignored, rebuilt)
│
└── validators/
    ├── claude-opus-4/
    │   ├── manifest.json               # Validator identity
    │   └── records/
    │       ├── 2024-12-24.json         # Validation batch
    │       ├── 2024-12-25.json
    │       └── ...
    │
    ├── research-executor-v2/
    │   ├── manifest.json
    │   └── records/
    │       └── ...
    │
    ├── human-markr/
    │   ├── manifest.json
    │   └── records/
    │       └── 2024-12-24.json
    │
    └── url-checker-bot/
        ├── manifest.json
        └── records/
            └── ...
```

---

## 4. CLI Tool Specification

### 4.1 record_validation.py

Command-line tool for recording validations.

**Usage:**

```bash
# Record a single validation
python scripts/record_validation.py \
  --validator claude-opus-4 \
  --event "1971-08-23--powell-memo" \
  --type source \
  --confidence high \
  --notes "Verified against Washington & Lee archives"

# Record multiple validations from JSON input
python scripts/record_validation.py \
  --validator claude-opus-4 \
  --from-file validations.json

# Initialize a new validator
python scripts/record_validation.py init-validator \
  --id human-markr \
  --type human \
  --name "Mark R" \
  --capabilities source,factual,primary-source

# List validators
python scripts/record_validation.py list-validators

# Query validations for an event
python scripts/record_validation.py query \
  --event "1971-08-23--powell-memo"

# Get unvalidated events
python scripts/record_validation.py unvalidated \
  --after 2020-01-01 \
  --importance-min 7
```

**Commands:**

| Command | Description |
|---------|-------------|
| `record` (default) | Record one or more validations |
| `init-validator` | Create a new validator manifest |
| `list-validators` | List all registered validators |
| `query` | Query validations for event(s) |
| `unvalidated` | List events lacking validation |
| `stats` | Show validation statistics |
| `rebuild-index` | Regenerate index.json |

### 4.2 Integration with generate.py

The existing `generate.py` script will be extended to:

1. Scan `validators/*/records/*.json` files
2. Aggregate validations per event
3. Generate `timeline/data/api/validations.json`
4. Update `stats.json` with validation counts

---

## 5. Browser Client Integration

### 5.1 IndexedDB Schema Extension

**New Object Store: `validations`**

```javascript
// In TimelineDB.js initialization
const validationStore = db.createObjectStore('validations', { keyPath: 'event_id' });
validationStore.createIndex('confidence', 'confidence', { unique: false });
validationStore.createIndex('validation_count', 'validation_count', { unique: false });
validationStore.createIndex('last_validated', 'last_validated', { unique: false });
```

**Record Structure:**

```javascript
{
  event_id: "1971-08-23--powell-memo",
  validation_count: 3,
  validators: ["claude-opus-4", "human-markr"],
  types: ["source", "factual", "primary-source"],
  confidence: "high",
  last_validated: "2024-12-24T15:30:45Z",
  issues: []
}
```

### 5.2 Data Loading

**In useIndexedDB.js:**

```javascript
// Load validations alongside events
const loadValidations = async () => {
  const response = await fetch(`${API_BASE}/validations.json`);
  const data = await response.json();

  // Store summary in metadata
  await db.metadata.put({ key: 'validationSummary', value: data.summary });

  // Store per-event validations
  const tx = db.transaction(['validations'], 'readwrite');
  for (const [eventId, validation] of Object.entries(data.events)) {
    await tx.store.put({ event_id: eventId, ...validation });
  }
};
```

### 5.3 Query Methods

**In TimelineDB.js:**

```javascript
class TimelineDB {
  // Get validation for single event
  async getValidation(eventId) {
    const tx = this.db.transaction(['validations'], 'readonly');
    return tx.objectStore('validations').get(eventId);
  }

  // Get events with minimum validation count
  async getValidatedEvents(minCount = 1) {
    const tx = this.db.transaction(['validations'], 'readonly');
    const index = tx.objectStore('validations').index('validation_count');
    const range = IDBKeyRange.lowerBound(minCount);
    return index.getAll(range);
  }

  // Get events by confidence level
  async getEventsByConfidence(confidence) {
    const tx = this.db.transaction(['validations'], 'readonly');
    const index = tx.objectStore('validations').index('confidence');
    return index.getAll(confidence);
  }

  // Get unvalidated events
  async getUnvalidatedEvents() {
    const allEvents = await this.getAllEventIds();
    const validatedIds = new Set(
      (await this.getAllValidations()).map(v => v.event_id)
    );
    return allEvents.filter(id => !validatedIds.has(id));
  }

  // Get validation summary
  async getValidationSummary() {
    const tx = this.db.transaction(['metadata'], 'readonly');
    const result = await tx.objectStore('metadata').get('validationSummary');
    return result?.value;
  }
}
```

### 5.4 UI Components

**ValidationBadge.jsx:**

```jsx
const ValidationBadge = ({ eventId }) => {
  const validation = useValidation(eventId);

  if (!validation) {
    return <span className="badge badge-unvalidated">Unverified</span>;
  }

  const confidenceColors = {
    high: 'green',
    medium: 'yellow',
    low: 'orange',
    disputed: 'red',
    failed: 'gray'
  };

  return (
    <span
      className={`badge badge-${validation.confidence}`}
      title={`Validated by ${validation.validators.join(', ')}`}
    >
      {validation.confidence === 'high' ? '✓' : '?'}
      {validation.validation_count} validation{validation.validation_count !== 1 ? 's' : ''}
    </span>
  );
};
```

**FilterPanel extension:**

```jsx
// Add to existing FilterPanel.jsx
<div className="filter-section">
  <h4>Validation</h4>

  <label>
    <input
      type="checkbox"
      checked={showValidatedOnly}
      onChange={e => setShowValidatedOnly(e.target.checked)}
    />
    Show validated only
  </label>

  <label>
    Minimum confidence:
    <select value={minConfidence} onChange={e => setMinConfidence(e.target.value)}>
      <option value="">Any</option>
      <option value="high">High</option>
      <option value="medium">Medium+</option>
      <option value="low">Low+</option>
    </select>
  </label>

  <label>
    Trust validators:
    <select multiple value={trustedValidators} onChange={handleValidatorChange}>
      {validators.map(v => (
        <option key={v.id} value={v.id}>{v.name} ({v.type})</option>
      ))}
    </select>
  </label>
</div>
```

---

## 6. Validation Workflow

### 6.1 AI Agent Validation Flow

```
1. Agent receives task: "Validate events from 1970-1980"

2. Agent queries unvalidated events:
   $ python scripts/record_validation.py unvalidated --after 1970-01-01 --before 1980-01-01

3. For each event, agent:
   a. Reads event content
   b. Checks sources (fetches URLs, verifies content)
   c. Cross-references with other events
   d. Records validation:
      $ python scripts/record_validation.py \
          --validator claude-opus-4 \
          --event "1971-08-23--powell-memo" \
          --type source \
          --confidence high \
          --sources-checked "https://..." \
          --notes "Verified against primary source"

4. Agent commits validation batch:
   $ git add timeline/data/validations/validators/claude-opus-4/
   $ git commit -m "Validate 47 events from 1970-1980"
```

### 6.2 Human Validation Flow

```
1. Human opens timeline viewer
2. Filters to show unvalidated events
3. Reviews event and sources
4. Uses CLI or future web UI to record validation
5. Commits changes
```

### 6.3 Automated Validation Flow

```
1. CI/CD runs url-checker-bot nightly
2. Bot fetches all source URLs
3. Records validation for accessible sources
4. Flags broken links with confidence: "failed"
5. Auto-commits results
```

---

## 7. Trust Model

### 7.1 Validator Trust Levels

| Level | Description | Use Case |
|-------|-------------|----------|
| `automated` | Bot/script, no human review | URL checking, date validation |
| `reviewed` | AI with human spot-checking | Claude validations reviewed periodically |
| `expert` | Human domain expert | Historian, journalist, researcher |

### 7.2 Client-Side Trust Configuration

Users can configure which validators they trust:

```javascript
// In browser localStorage or config
const trustedValidators = {
  'human-markr': true,
  'claude-opus-4': true,
  'research-executor-v2': true,
  'url-checker-bot': false  // User doesn't trust automated checks alone
};

// Validation considered "trusted" only if at least one trusted validator confirms
const isTrustedValidation = (validation) => {
  return validation.validators.some(v => trustedValidators[v]);
};
```

### 7.3 Consensus Requirements

For critical events, require multiple validators:

```javascript
const validationPolicy = {
  importance_threshold: 8,  // High-importance events
  min_validators: 2,        // Require at least 2 validators
  require_human: true       // At least one human validator
};
```

---

## 8. Schema Definitions

### 8.1 JSON Schema for Validation Records

**Location:** `timeline/data/validations/schema.json`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://kleptocracy-timeline.org/schemas/validation-batch.json",
  "title": "Validation Batch",
  "type": "object",
  "required": ["validator_id", "batch_id", "created_at", "validations"],
  "properties": {
    "validator_id": {
      "type": "string",
      "pattern": "^[a-z0-9-]+$"
    },
    "batch_id": {
      "type": "string"
    },
    "created_at": {
      "type": "string",
      "format": "date-time"
    },
    "session_context": {
      "type": "string"
    },
    "validations": {
      "type": "array",
      "items": {
        "$ref": "#/definitions/validation"
      }
    }
  },
  "definitions": {
    "validation": {
      "type": "object",
      "required": ["event_id", "timestamp", "type", "confidence"],
      "properties": {
        "event_id": {
          "type": "string"
        },
        "timestamp": {
          "type": "string",
          "format": "date-time"
        },
        "type": {
          "type": "string",
          "enum": ["source", "factual", "completeness", "cross-reference", "primary-source", "context", "bias"]
        },
        "confidence": {
          "type": "string",
          "enum": ["high", "medium", "low", "disputed", "failed"]
        },
        "sources_checked": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "url": { "type": "string", "format": "uri" },
              "status": { "type": "string", "enum": ["verified", "broken", "changed", "paywall"] },
              "accessed_at": { "type": "string", "format": "date-time" }
            }
          }
        },
        "notes": {
          "type": "string"
        },
        "claims_verified": {
          "type": "array",
          "items": { "type": "string" }
        },
        "issues_found": {
          "type": "array",
          "items": { "type": "string" }
        },
        "suggested_corrections": {
          "type": "object"
        }
      }
    }
  }
}
```

---

## 9. Implementation Phases

### Phase 1: Foundation (This PR)
- [ ] Create folder structure
- [ ] Define schemas
- [ ] Implement `record_validation.py` CLI
- [ ] Extend `generate.py` to build validation index
- [ ] Add pre-commit hook integration

### Phase 2: AI Agent Integration
- [ ] Update research-executor to record validations
- [ ] Create validation prompts for Claude
- [ ] Implement batch validation workflow
- [ ] Add URL checking bot

### Phase 3: Browser Client
- [ ] Add validations store to IndexedDB
- [ ] Load validation index on sync
- [ ] Create ValidationBadge component
- [ ] Add validation filters to FilterPanel
- [ ] Create ValidationDetails modal

### Phase 4: Advanced Features
- [ ] Cryptographic signing of validations
- [ ] Dispute resolution workflow
- [ ] Validation staleness detection
- [ ] Re-validation scheduling
- [ ] Web UI for recording validations

---

## 10. Open Questions

1. **Validation expiry**: Should validations become stale after N months? Sources can change.

2. **Dispute resolution**: When validators disagree, how is it resolved?

3. **Retroactive invalidation**: If a validator is later deemed untrustworthy, how to handle their validations?

4. **Partial validation**: Can an event be "partially validated" (e.g., date verified but sources not)?

5. **Validation inheritance**: If Event A cites Event B, does validating B help validate A?

---

## 11. References

- [CaptureCascadeTimeline Browser Client](https://github.com/markramm/CaptureCascadeTimeline)
- [Timeline Event Schema](../schemas/timeline_event_schema.json)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
