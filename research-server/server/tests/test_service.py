import pytest
import os
import sqlite3
from services.standardization_service import StandardizationService

# Fixture for the service with an in-memory database
@pytest.fixture
def service():
    # Use in-memory database for fast, isolated tests
    svc = StandardizationService(':memory:')
    return svc

def test_create_and_get_actor(service):
    actor_id = service.create_actor(
        canonical_name="Peter Thiel",
        category="Person",
        description="Tech investor"
    )
    assert actor_id > 0
    
    actor = service.get_actor(actor_id)
    assert actor is not None
    assert actor['canonical_name'] == "Peter Thiel"
    assert actor['category'] == "Person"

def test_actor_aliases(service):
    actor_id = service.create_actor("FBI", category="Org")
    
    alias_id = service.add_alias(actor_id, "fbi", source="test")
    assert alias_id > 0
    
    actor = service.get_actor(actor_id)
    assert len(actor['aliases']) == 1
    assert actor['aliases'][0]['alias_name'] == "fbi"

def test_list_actors_pagination(service):
    # Create 3 actors
    service.create_actor("Actor A")
    service.create_actor("Actor B")
    service.create_actor("Actor C")
    
    actors, total = service.list_actors(limit=2)
    assert len(actors) == 2
    assert total == 3
    
    actors_page_2, total_2 = service.list_actors(page=2, limit=2)
    assert len(actors_page_2) == 1
    assert total_2 == 3
    assert actors_page_2[0]['canonical_name'] == "Actor C"

def test_update_actor(service):
    actor_id = service.create_actor("Old Name")
    result = service.update_actor(actor_id, canonical_name="New Name", description="Updated")
    
    assert result is True
    actor = service.get_actor(actor_id)
    assert actor['canonical_name'] == "New Name"
    assert actor['description'] == "Updated"

def test_delete_actor_cascades(service):
    actor_id = service.create_actor("To Delete")
    service.add_alias(actor_id, "alias-to-delete")
    
    assert service.delete_actor(actor_id) is True
    
    assert service.get_actor(actor_id) is None
    
    # Verify alias is gone (direct DB check to be sure)
    conn = service._get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT count(*) as count FROM actor_aliases WHERE canonical_id = ?", (actor_id,))
    assert cursor.fetchone()['count'] == 0

def test_import_validation(service):
    rules = {
        'alias1': 'Canonical One',
        'alias2': 'Canonical One', # Same actor
        'alias3': 'Canonical Two'
    }
    
    stats = service.import_from_dict(rules, source="pytest")
    
    assert stats['actors_created'] == 2 # Canonical One, Canonical Two
    assert stats['aliases_created'] == 3

def test_suggestions_flow(service):
    s_id = service.create_suggestion("New Actor", "new-actor", 0.9, "fuzzy")
    
    pending = service.get_suggestions(status='pending')
    assert len(pending) == 1
    assert pending[0]['id'] == s_id
    
    service.review_suggestion(s_id, 'approved', 'tester')
    
    approved = service.get_suggestions(status='approved')
    assert len(approved) == 1
