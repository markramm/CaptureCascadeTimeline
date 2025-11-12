#!/usr/bin/env python3
"""
Export missing events from research database to markdown files.
"""

import json
import os
import sys
from pathlib import Path
from datetime import datetime
import frontmatter

# Add research client to path
sys.path.insert(0, str(Path(__file__).parent / 'research-server' / 'client'))
from research_client import TimelineResearchClient

def convert_to_markdown(event):
    """Convert event dict to markdown with YAML frontmatter."""
    # Extract content/summary for markdown body
    summary = event.get('summary', '')

    # Prepare frontmatter
    metadata = {
        'id': event.get('id'),
        'date': event.get('date'),
        'title': event.get('title'),
        'importance': event.get('importance', 5),
        'tags': event.get('tags', []),
        'actors': event.get('actors', []),
        'sources': event.get('sources', []),
    }

    # Add optional fields if present
    if event.get('status'):
        metadata['status'] = event['status']
    if event.get('confirmed_date'):
        metadata['confirmed_date'] = event['confirmed_date']
    if event.get('location'):
        metadata['location'] = event['location']

    # Remove None values
    metadata = {k: v for k, v in metadata.items() if v is not None}

    # Create frontmatter post
    post = frontmatter.Post(summary, **metadata)

    return frontmatter.dumps(post)

def main():
    print("Exporting missing events from database to markdown files...")

    # Initialize client
    client = TimelineResearchClient()

    # Get all events from database
    print("\n1. Fetching all events from database...")
    try:
        result = client.search_events("")
        # Handle both dict and list responses
        if isinstance(result, dict):
            if not result.get('success'):
                print(f"❌ Error fetching events: {result.get('error')}")
                return 1
            all_events = result.get('data', {}).get('events', [])
        else:
            # Direct list response
            all_events = result
    except Exception as e:
        print(f"❌ Error fetching events: {e}")
        return 1
    print(f"   Found {len(all_events)} events in database")

    # Check which events are missing from filesystem
    print("\n2. Checking which events are missing from filesystem...")
    events_dir = Path('timeline/data/events')
    missing_events = []
    existing_count = 0

    for event in all_events:
        event_id = event.get('id')
        if not event_id:
            continue

        md_path = events_dir / f"{event_id}.md"
        if not md_path.exists():
            missing_events.append(event)
        else:
            existing_count += 1

    print(f"   ✅ Already in filesystem: {existing_count} events")
    print(f"   ❌ Missing from filesystem: {len(missing_events)} events")

    if len(missing_events) == 0:
        print("\n✨ All events are already in filesystem!")
        return 0

    # Show samples
    print("\n3. Sample missing events:")
    for event in missing_events[:5]:
        print(f"   - {event.get('id')} ({event.get('date')}): {event.get('title')[:60]}...")

    # Confirm export
    print(f"\n4. Ready to export {len(missing_events)} events to markdown files")
    response = input("   Continue? (y/n): ")
    if response.lower() != 'y':
        print("   Cancelled.")
        return 0

    # Export missing events
    print("\n5. Exporting events...")
    events_dir.mkdir(parents=True, exist_ok=True)
    exported = 0
    errors = []

    for event in missing_events:
        try:
            event_id = event.get('id')
            if not event_id:
                errors.append(f"Event missing ID: {event.get('title')}")
                continue

            md_content = convert_to_markdown(event)
            md_path = events_dir / f"{event_id}.md"

            with open(md_path, 'w', encoding='utf-8') as f:
                f.write(md_content)

            exported += 1
            if exported % 50 == 0:
                print(f"   Exported {exported}/{len(missing_events)}...")

        except Exception as e:
            errors.append(f"Error exporting {event.get('id')}: {e}")

    print(f"\n✅ Successfully exported {exported} events")

    if errors:
        print(f"\n⚠️  {len(errors)} errors occurred:")
        for error in errors[:10]:
            print(f"   - {error}")
        if len(errors) > 10:
            print(f"   ... and {len(errors) - 10} more")

    # Summary
    print("\n" + "="*70)
    print(f"SUMMARY:")
    print(f"  Total events in database: {len(all_events)}")
    print(f"  Already in filesystem: {existing_count}")
    print(f"  Newly exported: {exported}")
    print(f"  Errors: {len(errors)}")
    print(f"  Final filesystem total: {existing_count + exported}")
    print("="*70)

    return 0

if __name__ == '__main__':
    sys.exit(main())
