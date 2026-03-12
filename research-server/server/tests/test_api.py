import pytest
import json
from app_v2 import app
from services.standardization_service import StandardizationService

@pytest.fixture
def client():
    app.config['TESTING'] = True
    # Use a new in-memory DB for every test
    # We need to monkeypatch the service in the app, or rely on app using an env var or predictable path.
    # Since app_v2.py initializes `service` at module level, it's harder to mock without dependency injection.
    # However, `StandardizationService` supports `:memory:` if we re-init it or if `DB_PATH` env var is set.
    
    # For now, let's just let it run. But wait, app_v2.py loads DB_PATH from env.
    # We should probably patch `app_v2.service` to use an in-memory db.
    
    with app.test_client() as client:
        # Reset service for test isolation
        # The blueprint `routes.standardization` has its own `service` instance initialized at module level.
        # We must patch THAT instance.
        
        import routes.standardization
        old_service = routes.standardization.service
        routes.standardization.service = StandardizationService(':memory:')
        
        yield client
        
        # Cleanup (optional but good hygiene)
        routes.standardization.service = old_service

def test_health_check(client):
    rv = client.get('/health')
    assert rv.status_code == 200
    assert rv.json['status'] == 'healthy'

def test_create_actor_api(client):
    data = {
        "canonical_name": "API Actor",
        "category": "Test",
        "description": "Created via API"
    }
    rv = client.post('/api/standardization/actors', json=data)
    assert rv.status_code == 201
    assert 'id' in rv.json
    
    # Verify we can get it
    actor_id = rv.json['id']
    rv_get = client.get(f'/api/standardization/actors/{actor_id}')
    assert rv_get.status_code == 200
    assert rv_get.json['canonical_name'] == "API Actor"

def test_list_actors_api(client):
    client.post('/api/standardization/actors', json={"canonical_name": "A"})
    client.post('/api/standardization/actors', json={"canonical_name": "B"})
    
    rv = client.get('/api/standardization/actors?limit=10')
    assert rv.status_code == 200
    assert len(rv.json['actors']) == 2
    assert rv.json['total'] == 2

def test_add_alias_api(client):
    # Create actor
    rv = client.post('/api/standardization/actors', json={"canonical_name": "Main"})
    actor_id = rv.json['id']
    
    # Add alias
    rv_alias = client.post(f'/api/standardization/actors/{actor_id}/aliases', json={
        "alias_name": "main-alias",
        "source": "api-test"
    })
    assert rv_alias.status_code == 201
    
    # Verify
    rv_get = client.get(f'/api/standardization/actors/{actor_id}')
    aliases = rv_get.json['aliases']
    assert len(aliases) == 1
    assert aliases[0]['alias_name'] == "main-alias"

def test_create_actor_validation(client):
    # Missing canonical_name
    rv = client.post('/api/standardization/actors', json={"category": "Void"})
    assert rv.status_code == 400
    assert "required" in rv.json['error']

def test_not_found(client):
    rv = client.get('/api/standardization/actors/99999')
    assert rv.status_code == 404
