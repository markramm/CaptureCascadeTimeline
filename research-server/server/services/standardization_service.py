"""
Actor Standardization Service

Handles CRUD operations for actor standardizations, aliases, and suggestions.
"""

import sqlite3
from datetime import datetime
from typing import List, Dict, Optional, Tuple
from pathlib import Path
import json


# Database schema embedded for reliability
SCHEMA_SQL = """
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
"""


class StandardizationService:
    """Service for managing actor standardizations."""

    def __init__(self, db_path: str):
        """Initialize service with database path."""
        self.db_path = db_path
        self._persistent_conn = None

        # For in-memory databases, keep connection alive
        if db_path == ':memory:':
            self._persistent_conn = sqlite3.connect(db_path)
            self._persistent_conn.row_factory = sqlite3.Row
            self._persistent_conn.executescript(SCHEMA_SQL)
            self._persistent_conn.commit()
        else:
            self._ensure_tables()

    def _get_connection(self) -> sqlite3.Connection:
        """Get database connection."""
        if self._persistent_conn:
            return self._persistent_conn

        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _ensure_tables(self):
        """Ensure standardization tables exist."""
        conn = self._get_connection()
        conn.executescript(SCHEMA_SQL)
        conn.commit()
        if not self._persistent_conn:
            conn.close()

    # ==================== Actor Standardizations ====================

    def create_actor(self, canonical_name: str, category: Optional[str] = None,
                    description: Optional[str] = None, notes: Optional[str] = None,
                    created_by: str = "system") -> int:
        """
        Create a new canonical actor.

        Returns:
            int: ID of created actor
        """
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO actor_standardizations
            (canonical_name, category, description, notes, created_by)
            VALUES (?, ?, ?, ?, ?)
        """, (canonical_name, category, description, notes, created_by))

        actor_id = cursor.lastrowid
        conn.commit()
        if not self._persistent_conn:
            conn.close()

        return actor_id

    def get_actor(self, actor_id: int) -> Optional[Dict]:
        """Get actor by ID with aliases."""
        conn = self._get_connection()
        cursor = conn.cursor()

        # Get actor
        cursor.execute("""
            SELECT * FROM actor_standardizations WHERE id = ?
        """, (actor_id,))

        row = cursor.fetchone()
        if not row:
            if not self._persistent_conn:
                conn.close()
            return None

        actor = dict(row)

        # Get aliases
        cursor.execute("""
            SELECT * FROM actor_aliases WHERE canonical_id = ?
            ORDER BY confidence DESC, alias_name
        """, (actor_id,))

        actor['aliases'] = [dict(r) for r in cursor.fetchall()]
        if not self._persistent_conn:
            conn.close()

        return actor

    def list_actors(self, category: Optional[str] = None, search: Optional[str] = None,
                   page: int = 1, limit: int = 20) -> Tuple[List[Dict], int]:
        """
        List actors with pagination.

        Returns:
            Tuple of (actors list, total count)
        """
        conn = self._get_connection()
        cursor = conn.cursor()

        # Build query
        where_clauses = []
        params = []

        if category:
            where_clauses.append("category = ?")
            params.append(category)

        if search:
            where_clauses.append("canonical_name LIKE ?")
            params.append(f"%{search}%")

        where_sql = "WHERE " + " AND ".join(where_clauses) if where_clauses else ""

        # Get total count
        cursor.execute(f"""
            SELECT COUNT(*) as count FROM actor_standardizations {where_sql}
        """, params)
        total = cursor.fetchone()['count']

        # Get paginated results
        offset = (page - 1) * limit
        cursor.execute(f"""
            SELECT a.*,
                   (SELECT COUNT(*) FROM actor_aliases WHERE canonical_id = a.id) as alias_count,
                   COALESCE(u.event_count, 0) as event_count
            FROM actor_standardizations a
            LEFT JOIN actor_usage_cache u ON u.actor_name = a.canonical_name
            {where_sql}
            ORDER BY a.canonical_name
            LIMIT ? OFFSET ?
        """, params + [limit, offset])

        actors = [dict(row) for row in cursor.fetchall()]
        if not self._persistent_conn:
            conn.close()

        return actors, total

    def update_actor(self, actor_id: int, **kwargs) -> bool:
        """Update actor fields."""
        conn = self._get_connection()
        cursor = conn.cursor()

        allowed_fields = ['canonical_name', 'category', 'description', 'notes']
        updates = []
        values = []

        for field in allowed_fields:
            if field in kwargs:
                updates.append(f"{field} = ?")
                values.append(kwargs[field])

        if not updates:
            if not self._persistent_conn:
                conn.close()
            return False

        updates.append("updated_date = ?")
        values.append(datetime.now().isoformat())
        values.append(actor_id)

        cursor.execute(f"""
            UPDATE actor_standardizations
            SET {', '.join(updates)}
            WHERE id = ?
        """, values)

        success = cursor.rowcount > 0
        conn.commit()
        if not self._persistent_conn:
            conn.close()

        return success

    def delete_actor(self, actor_id: int) -> bool:
        """Delete actor (cascades to aliases)."""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("DELETE FROM actor_standardizations WHERE id = ?", (actor_id,))

        success = cursor.rowcount > 0
        conn.commit()
        if not self._persistent_conn:
            conn.close()

        return success

    # ==================== Aliases ====================

    def add_alias(self, canonical_id: int, alias_name: str, confidence: float = 1.0,
                 source: str = "manual") -> int:
        """Add alias to canonical actor."""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO actor_aliases (canonical_id, alias_name, confidence, source)
            VALUES (?, ?, ?, ?)
        """, (canonical_id, alias_name, confidence, source))

        alias_id = cursor.lastrowid
        conn.commit()
        if not self._persistent_conn:
            conn.close()

        return alias_id

    def remove_alias(self, alias_id: int) -> bool:
        """Remove an alias."""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("DELETE FROM actor_aliases WHERE id = ?", (alias_id,))

        success = cursor.rowcount > 0
        conn.commit()
        if not self._persistent_conn:
            conn.close()

        return success

    def get_alias_mapping(self) -> Dict[str, str]:
        """
        Get complete alias -> canonical mapping.

        Returns:
            Dict mapping alias names to canonical names
        """
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT aa.alias_name, ast.canonical_name
            FROM actor_aliases aa
            JOIN actor_standardizations ast ON aa.canonical_id = ast.id
        """)

        mapping = {row['alias_name']: row['canonical_name'] for row in cursor.fetchall()}
        if not self._persistent_conn:
            conn.close()

        return mapping

    # ==================== Suggestions ====================

    def create_suggestion(self, canonical: str, alias: str, confidence: float,
                         reason: str, event_count: int = 0) -> int:
        """Create a standardization suggestion."""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO standardization_suggestions
            (suggested_canonical, suggested_alias, confidence, reason, event_count)
            VALUES (?, ?, ?, ?, ?)
        """, (canonical, alias, confidence, reason, event_count))

        suggestion_id = cursor.lastrowid
        conn.commit()
        if not self._persistent_conn:
            conn.close()

        return suggestion_id

    def get_suggestions(self, status: str = "pending", min_confidence: float = 0.0) -> List[Dict]:
        """Get suggestions filtered by status and confidence."""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT * FROM standardization_suggestions
            WHERE status = ? AND confidence >= ?
            ORDER BY confidence DESC, event_count DESC
        """, (status, min_confidence))

        suggestions = [dict(row) for row in cursor.fetchall()]
        if not self._persistent_conn:
            conn.close()

        return suggestions

    def review_suggestion(self, suggestion_id: int, action: str, reviewed_by: str) -> bool:
        """Approve or reject a suggestion."""
        if action not in ['approved', 'rejected']:
            raise ValueError("Action must be 'approved' or 'rejected'")

        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            UPDATE standardization_suggestions
            SET status = ?, reviewed_by = ?, reviewed_date = ?
            WHERE id = ?
        """, (action, reviewed_by, datetime.now().isoformat(), suggestion_id))

        success = cursor.rowcount > 0
        conn.commit()
        if not self._persistent_conn:
            conn.close()

        return success

    # ==================== Application History ====================

    def log_application(self, batch_id: str, event_id: str, field_name: str,
                       old_value: str, new_value: str, applied_by: str) -> int:
        """Log a standardization application."""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO standardization_applications
            (batch_id, event_id, field_name, old_value, new_value, applied_by)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (batch_id, event_id, field_name, old_value, new_value, applied_by))

        log_id = cursor.lastrowid
        conn.commit()
        if not self._persistent_conn:
            conn.close()

        return log_id

    def get_application_history(self, batch_id: Optional[str] = None,
                                event_id: Optional[str] = None,
                                limit: int = 100) -> List[Dict]:
        """Get application history with optional filters."""
        conn = self._get_connection()
        cursor = conn.cursor()

        where_clauses = []
        params = []

        if batch_id:
            where_clauses.append("batch_id = ?")
            params.append(batch_id)

        if event_id:
            where_clauses.append("event_id = ?")
            params.append(event_id)

        where_sql = "WHERE " + " AND ".join(where_clauses) if where_clauses else ""

        cursor.execute(f"""
            SELECT * FROM standardization_applications
            {where_sql}
            ORDER BY applied_date DESC
            LIMIT ?
        """, params + [limit])

        history = [dict(row) for row in cursor.fetchall()]
        if not self._persistent_conn:
            conn.close()

        return history

    # ==================== Stats ====================

    def get_stats(self) -> Dict:
        """Get standardization statistics."""
        conn = self._get_connection()
        cursor = conn.cursor()

        stats = {}

        # Total actors
        cursor.execute("SELECT COUNT(*) as count FROM actor_standardizations")
        stats['total_actors'] = cursor.fetchone()['count']

        # Total aliases
        cursor.execute("SELECT COUNT(*) as count FROM actor_aliases")
        stats['total_aliases'] = cursor.fetchone()['count']

        # Pending suggestions
        cursor.execute("SELECT COUNT(*) as count FROM standardization_suggestions WHERE status = 'pending'")
        stats['pending_suggestions'] = cursor.fetchone()['count']

        # Actors by category
        cursor.execute("""
            SELECT category, COUNT(*) as count
            FROM actor_standardizations
            WHERE category IS NOT NULL
            GROUP BY category
            ORDER BY count DESC
        """)
        stats['actors_by_category'] = {row['category']: row['count'] for row in cursor.fetchall()}

        # Top actors by event count
        cursor.execute("""
            SELECT a.canonical_name, COALESCE(u.event_count, 0) as count
            FROM actor_standardizations a
            LEFT JOIN actor_usage_cache u ON u.actor_name = a.canonical_name
            ORDER BY count DESC
            LIMIT 10
        """)
        stats['top_actors'] = [dict(row) for row in cursor.fetchall()]

        if not self._persistent_conn:
            conn.close()
        return stats

    # ==================== Import/Export ====================

    def import_from_dict(self, standardizations: Dict[str, str],
                        category: str = "imported", source: str = "script") -> Dict:
        """
        Import standardizations from a dict (like from Python scripts).

        Args:
            standardizations: Dict mapping lowercase alias -> Canonical Name
            category: Category to assign to imported actors
            source: Source identifier for aliases

        Returns:
            Dict with import stats
        """
        stats = {
            'actors_created': 0,
            'aliases_created': 0,
            'errors': []
        }

        # Group by canonical name
        canonical_to_aliases = {}
        for alias_lower, canonical in standardizations.items():
            if canonical not in canonical_to_aliases:
                canonical_to_aliases[canonical] = []
            canonical_to_aliases[canonical].append(alias_lower)

        for canonical_name, aliases in canonical_to_aliases.items():
            try:
                # Check if actor already exists
                conn = self._get_connection()
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT id FROM actor_standardizations WHERE canonical_name = ?
                """, (canonical_name,))
                row = cursor.fetchone()
                if not self._persistent_conn:
                    conn.close()

                if row:
                    actor_id = row['id']
                else:
                    # Create actor
                    actor_id = self.create_actor(
                        canonical_name=canonical_name,
                        category=category,
                        created_by=source
                    )
                    stats['actors_created'] += 1

                # Add aliases
                for alias in aliases:
                    if alias != canonical_name.lower():
                        try:
                            self.add_alias(
                                canonical_id=actor_id,
                                alias_name=alias,
                                confidence=1.0,
                                source=source
                            )
                            stats['aliases_created'] += 1
                        except sqlite3.IntegrityError:
                            # Alias already exists, skip
                            pass

            except Exception as e:
                stats['errors'].append(f"Error importing {canonical_name}: {str(e)}")

        return stats

    def export_to_dict(self) -> Dict[str, str]:
        """
        Export standardizations to dict format (for Python scripts).

        Returns:
            Dict mapping lowercase alias -> Canonical Name
        """
        mapping = {}

        # Get all canonical actors
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT canonical_name FROM actor_standardizations")
        actors = cursor.fetchall()
        if not self._persistent_conn:
            conn.close()

        # Add canonical name -> canonical name mappings
        for actor in actors:
            canonical = actor['canonical_name']
            mapping[canonical.lower()] = canonical

        # Add alias mappings (will override canonical if alias matches)
        alias_map = self.get_alias_mapping()
        for alias, canonical in alias_map.items():
            mapping[alias.lower()] = canonical

        return mapping
