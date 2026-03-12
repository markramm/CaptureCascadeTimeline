#!/usr/bin/env python3
"""
Test script for Actor Standardization feature.

Tests the service layer and database operations.
"""

import sys
from pathlib import Path
from services.standardization_service import StandardizationService

# Test database (will be created in memory for testing)
TEST_DB = ':memory:'


def test_basic_operations():
    """Test basic CRUD operations."""
    print("Testing basic operations...")

    service = StandardizationService(TEST_DB)

    # Create actor
    actor_id = service.create_actor(
        canonical_name="Peter Thiel",
        category="Person",
        description="Tech investor"
    )
    assert actor_id > 0, "Actor creation failed"
    print(f"✓ Created actor with ID {actor_id}")

    # Get actor
    actor = service.get_actor(actor_id)
    assert actor is not None, "Actor retrieval failed"
    assert actor['canonical_name'] == "Peter Thiel", "Actor name mismatch"
    print(f"✓ Retrieved actor: {actor['canonical_name']}")

    # Add alias
    alias_id = service.add_alias(
        canonical_id=actor_id,
        alias_name="peter-thiel",
        source="test"
    )
    assert alias_id > 0, "Alias creation failed"
    print(f"✓ Added alias with ID {alias_id}")

    # Get actor with aliases
    actor = service.get_actor(actor_id)
    assert len(actor['aliases']) == 1, "Alias not retrieved"
    assert actor['aliases'][0]['alias_name'] == "peter-thiel", "Alias name mismatch"
    print(f"✓ Retrieved actor with {len(actor['aliases'])} alias(es)")

    # List actors
    actors, total = service.list_actors()
    assert total == 1, "Actor list count wrong"
    print(f"✓ Listed {total} actor(s)")

    # Update actor
    success = service.update_actor(actor_id, description="Tech investor, Palantir co-founder")
    assert success, "Actor update failed"
    print("✓ Updated actor")

    # Delete alias
    success = service.remove_alias(alias_id)
    assert success, "Alias deletion failed"
    print("✓ Deleted alias")

    # Delete actor
    success = service.delete_actor(actor_id)
    assert success, "Actor deletion failed"
    print("✓ Deleted actor")

    print("\nAll basic operations passed! ✅\n")


def test_import_export():
    """Test import/export functionality."""
    print("Testing import/export...")

    service = StandardizationService(TEST_DB)

    # Test data
    test_rules = {
        'trump administration': 'Trump Administration',
        'donald trump administration': 'Trump Administration',
        'fbi': 'FBI',
        'cia': 'CIA',
        'peter-thiel': 'Peter Thiel',
    }

    # Import
    stats = service.import_from_dict(test_rules, category="test", source="test-script")
    print(f"✓ Imported {stats['actors_created']} actors, {stats['aliases_created']} aliases")

    # Verify import
    actors, total = service.list_actors()
    assert total > 0, "No actors imported"
    print(f"✓ Found {total} actors after import")

    # Export
    exported = service.export_to_dict()
    assert len(exported) > 0, "Export returned empty dict"
    print(f"✓ Exported {len(exported)} mappings")

    # Verify export matches import
    for alias_lower, canonical in test_rules.items():
        assert alias_lower in exported, f"Missing alias: {alias_lower}"
        assert exported[alias_lower] == canonical, f"Wrong canonical for {alias_lower}"
    print("✓ Export matches import")

    print("\nImport/export passed! ✅\n")


def test_suggestions():
    """Test suggestion management."""
    print("Testing suggestions...")

    service = StandardizationService(TEST_DB)

    # Create suggestion
    sugg_id = service.create_suggestion(
        canonical="Trump Administration",
        alias="trump administration",
        confidence=0.95,
        reason="case_variation",
        event_count=28
    )
    assert sugg_id > 0, "Suggestion creation failed"
    print(f"✓ Created suggestion with ID {sugg_id}")

    # Get pending suggestions
    suggestions = service.get_suggestions(status="pending")
    assert len(suggestions) == 1, "Suggestion not retrieved"
    print(f"✓ Retrieved {len(suggestions)} pending suggestion(s)")

    # Approve suggestion
    success = service.review_suggestion(sugg_id, action="approved", reviewed_by="test")
    assert success, "Suggestion review failed"
    print("✓ Approved suggestion")

    # Verify status changed
    approved = service.get_suggestions(status="approved")
    assert len(approved) == 1, "Approved suggestion not found"
    pending = service.get_suggestions(status="pending")
    assert len(pending) == 0, "Suggestion still pending"
    print("✓ Suggestion status updated correctly")

    print("\nSuggestions passed! ✅\n")


def test_stats():
    """Test statistics."""
    print("Testing statistics...")

    service = StandardizationService(TEST_DB)

    # Add some data
    actor_id = service.create_actor("Test Actor", category="Test")
    service.add_alias(actor_id, "test-actor")
    service.create_suggestion("Canonical", "alias", 0.9, "test", 5)

    # Get stats
    stats = service.get_stats()

    assert 'total_actors' in stats, "Missing total_actors"
    assert 'total_aliases' in stats, "Missing total_aliases"
    assert 'pending_suggestions' in stats, "Missing pending_suggestions"
    assert stats['total_actors'] == 1, "Wrong actor count"
    assert stats['total_aliases'] == 1, "Wrong alias count"
    assert stats['pending_suggestions'] == 1, "Wrong suggestion count"

    print(f"✓ Stats: {stats['total_actors']} actors, {stats['total_aliases']} aliases, {stats['pending_suggestions']} suggestions")
    print("\nStatistics passed! ✅\n")


def run_all_tests():
    """Run all tests."""
    print("="*60)
    print("Actor Standardization Service Test Suite")
    print("="*60 + "\n")

    try:
        test_basic_operations()
        test_import_export()
        test_suggestions()
        test_stats()

        print("="*60)
        print("ALL TESTS PASSED! ✅✅✅")
        print("="*60)
        return 0

    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
        return 1
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(run_all_tests())
