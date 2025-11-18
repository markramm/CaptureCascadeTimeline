-- Actor Standardization System Database Schema

-- Core standardization rules
CREATE TABLE IF NOT EXISTS actor_standardizations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    canonical_name VARCHAR(255) NOT NULL UNIQUE,
    category VARCHAR(50),  -- person, organization, government, media, etc.
    description TEXT,
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_actor_canonical_name ON actor_standardizations(canonical_name);
CREATE INDEX IF NOT EXISTS idx_actor_category ON actor_standardizations(category);
CREATE INDEX IF NOT EXISTS idx_actor_created_date ON actor_standardizations(created_date);

-- Alias mappings
CREATE TABLE IF NOT EXISTS actor_aliases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    canonical_id INTEGER NOT NULL,
    alias_name VARCHAR(255) NOT NULL UNIQUE,
    confidence FLOAT DEFAULT 1.0,  -- 0-1 for fuzzy matches
    source VARCHAR(50),  -- manual, auto-detected, imported
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (canonical_id) REFERENCES actor_standardizations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_alias_canonical_id ON actor_aliases(canonical_id);
CREATE INDEX IF NOT EXISTS idx_alias_name ON actor_aliases(alias_name);
CREATE INDEX IF NOT EXISTS idx_alias_source ON actor_aliases(source);

-- Application history/audit log
CREATE TABLE IF NOT EXISTS standardization_applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id VARCHAR(100),
    event_id VARCHAR(255),
    field_name VARCHAR(50),  -- 'actors' or 'tags'
    old_value VARCHAR(255),
    new_value VARCHAR(255),
    applied_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    applied_by VARCHAR(100),
    can_revert BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_app_batch_id ON standardization_applications(batch_id);
CREATE INDEX IF NOT EXISTS idx_app_event_id ON standardization_applications(event_id);
CREATE INDEX IF NOT EXISTS idx_app_applied_date ON standardization_applications(applied_date);

-- Pending suggestions (for review)
CREATE TABLE IF NOT EXISTS standardization_suggestions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    suggested_canonical VARCHAR(255),
    suggested_alias VARCHAR(255),
    confidence FLOAT,
    reason TEXT,  -- similarity_score, case_variation, etc.
    status VARCHAR(20) DEFAULT 'pending',  -- pending, approved, rejected
    event_count INTEGER,  -- how many events use this alias
    reviewed_by VARCHAR(100),
    reviewed_date DATETIME
);

CREATE INDEX IF NOT EXISTS idx_sugg_status ON standardization_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_sugg_confidence ON standardization_suggestions(confidence);
CREATE INDEX IF NOT EXISTS idx_sugg_canonical ON standardization_suggestions(suggested_canonical);

-- Actor usage cache (for performance)
CREATE TABLE IF NOT EXISTS actor_usage_cache (
    actor_name VARCHAR(255) PRIMARY KEY,
    event_count INTEGER DEFAULT 0,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_usage_count ON actor_usage_cache(event_count);
