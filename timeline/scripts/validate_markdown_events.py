#!/usr/bin/env python3
"""
Comprehensive validation for markdown timeline events.

Validates:
- YAML frontmatter syntax
- Required fields (id, date, title, sources)
- Field types and formats
- ID matches filename
- Date format (YYYY-MM-DD)
- Source structure
- Normalization compliance

Usage:
    python scripts/validate_markdown_events.py                    # Validate all
    python scripts/validate_markdown_events.py event.md           # Validate one file
    python scripts/validate_markdown_events.py --staged           # Validate staged files
    python scripts/validate_markdown_events.py --fix              # Auto-fix simple issues
"""

import os
import sys
import re
import yaml
import json
import subprocess
from pathlib import Path
from datetime import datetime
from typing import List, Tuple, Dict, Any, Optional

SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR.parent / "data"
EVENTS_DIR = DATA_DIR / "events"
ALIASES_FILE = DATA_DIR / "actor_aliases.json"


def load_actor_aliases() -> Dict[str, str]:
    """Load actor alias mapping."""
    if not ALIASES_FILE.exists():
        return {}
    with open(ALIASES_FILE) as f:
        canonical_to_aliases = json.load(f)
    return {alias: canonical for canonical, aliases in canonical_to_aliases.items() for alias in aliases}


# Valid status values
VALID_STATUSES = {
    'confirmed', 'reported', 'disputed', 'developing', 'unknown'
}


def parse_markdown_event(filepath: Path) -> Tuple[Optional[Dict], Optional[str], List[str]]:
    """
    Parse a markdown event file.

    Returns:
        (frontmatter_dict, body_text, errors)
    """
    errors = []

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        return None, None, [f"Cannot read file: {e}"]

    # Check for frontmatter
    if not content.startswith('---'):
        return None, None, ["File must start with YAML frontmatter (---)"]

    # Split frontmatter and body
    parts = content.split('---', 2)
    if len(parts) < 3:
        return None, None, ["Invalid frontmatter format - missing closing ---"]

    frontmatter_str = parts[1]
    body = parts[2].strip()

    # Check for duplicate keys within source blocks (Hugo strict mode fails on these)
    fm_lines = frontmatter_str.split('\n')
    seen_keys = set()
    for line in fm_lines:
        stripped = line.strip()
        indent = len(line) - len(line.lstrip()) if stripped else 0
        if stripped.startswith('- ') and indent == 0:
            seen_keys = set()
            key_match = re.match(r'-\s+(\w+):', stripped)
            if key_match:
                seen_keys.add(key_match.group(1))
            continue
        if indent == 2:
            key_match = re.match(r'\s+(\w+):', line)
            if key_match:
                key = key_match.group(1)
                if key in seen_keys:
                    errors.append(f"Duplicate key '{key}' in source block (Hugo will reject this)")
                seen_keys.add(key)
        if indent == 0 and stripped and not stripped.startswith('-'):
            seen_keys = set()

    # Parse YAML
    try:
        frontmatter = yaml.safe_load(frontmatter_str)
    except yaml.YAMLError as e:
        return None, None, [f"YAML parse error: {e}"]

    if not isinstance(frontmatter, dict):
        return None, None, ["Frontmatter must be a YAML dictionary"]

    return frontmatter, body, errors


def validate_required_fields(data: Dict, filepath: Path) -> List[str]:
    """Validate required fields are present and properly formatted."""
    errors = []

    # Required fields
    required = ['id', 'date', 'title']
    for field in required:
        if field not in data:
            errors.append(f"Missing required field: {field}")
        elif not data[field]:
            errors.append(f"Empty required field: {field}")

    return errors


def validate_id(data: Dict, filepath: Path) -> List[str]:
    """Validate event ID format and filename match."""
    errors = []

    if 'id' not in data:
        return errors

    event_id = data['id']

    if not isinstance(event_id, str):
        errors.append(f"ID must be a string, got: {type(event_id).__name__}")
        return errors

    # ID must contain date separator
    if '--' not in event_id:
        errors.append(f"ID must contain '--' separator: {event_id}")

    # ID must match filename
    if event_id != filepath.stem:
        errors.append(f"ID '{event_id}' must match filename '{filepath.stem}'")

    # ID should start with date
    id_date_match = re.match(r'^(\d{4}-\d{2}-\d{2})--', event_id)
    if not id_date_match:
        errors.append(f"ID must start with YYYY-MM-DD--: {event_id}")

    return errors


def validate_date(data: Dict) -> List[str]:
    """Validate date format."""
    errors = []

    if 'date' not in data:
        return errors

    date_str = str(data['date'])

    # Check format
    if not re.match(r'^\d{4}-\d{2}-\d{2}$', date_str):
        errors.append(f"Date must be YYYY-MM-DD format: {date_str}")
        return errors

    # Check valid date
    try:
        year, month, day = date_str.split('-')
        datetime(int(year), int(month), int(day))
    except ValueError as e:
        errors.append(f"Invalid date: {date_str} - {e}")

    return errors


def validate_importance(data: Dict) -> List[str]:
    """Validate importance score."""
    errors = []

    if 'importance' not in data:
        return errors

    importance = data['importance']

    if not isinstance(importance, (int, float)):
        errors.append(f"Importance must be a number, got: {type(importance).__name__}")
    elif not (1 <= importance <= 10):
        errors.append(f"Importance must be 1-10, got: {importance}")

    return errors


def validate_actors(data: Dict, actor_aliases: Dict[str, str]) -> List[str]:
    """Validate actors list and normalization."""
    errors = []

    if 'actors' not in data:
        return errors

    actors = data['actors']

    if not isinstance(actors, list):
        errors.append(f"Actors must be a list, got: {type(actors).__name__}")
        return errors

    for actor in actors:
        if not isinstance(actor, str):
            errors.append(f"Actor must be a string, got: {type(actor).__name__}")
        elif actor in actor_aliases:
            errors.append(f"Actor '{actor}' should be '{actor_aliases[actor]}' (normalization)")

    return errors


def validate_tags(data: Dict) -> List[str]:
    """Validate tags list and format."""
    errors = []

    if 'tags' not in data:
        return errors

    tags = data['tags']

    if not isinstance(tags, list):
        errors.append(f"Tags must be a list, got: {type(tags).__name__}")
        return errors

    for tag in tags:
        if tag is None:
            errors.append("Tag cannot be null/None")
        elif not isinstance(tag, str):
            errors.append(f"Tag must be a string, got: {type(tag).__name__}")
        elif tag != tag.lower():
            errors.append(f"Tag '{tag}' must be lowercase: '{tag.lower()}'")

    return errors


def validate_sources(data: Dict) -> List[str]:
    """Validate sources list and structure."""
    errors = []

    if 'sources' not in data:
        errors.append("Missing sources - events must have at least one source")
        return errors

    sources = data['sources']

    if not isinstance(sources, list):
        errors.append(f"Sources must be a list, got: {type(sources).__name__}")
        return errors

    if len(sources) == 0:
        errors.append("Sources list is empty - events must have at least one source")
        return errors

    for i, source in enumerate(sources):
        if not isinstance(source, dict):
            errors.append(f"Source {i+1} must be a dictionary")
            continue

        # Required source fields
        if 'url' not in source:
            errors.append(f"Source {i+1} missing 'url' field")
        elif not isinstance(source['url'], str):
            errors.append(f"Source {i+1} url must be a string")
        elif not source['url'].startswith(('http://', 'https://')):
            errors.append(f"Source {i+1} url must start with http:// or https://")

        if 'title' not in source:
            errors.append(f"Source {i+1} missing 'title' field")

        # Check for old 'publisher' field
        if 'publisher' in source and 'outlet' not in source:
            errors.append(f"Source {i+1} uses 'publisher' - should be 'outlet'")

        # Check for old 'publication' field
        if 'publication' in source and 'outlet' not in source:
            errors.append(f"Source {i+1} uses 'publication' - should be 'outlet'")

        # Validate tier if present
        if 'tier' in source:
            tier = source['tier']
            if not isinstance(tier, int) or tier not in [1, 2, 3]:
                errors.append(f"Source {i+1} tier must be 1, 2, or 3")

    return errors


def validate_status(data: Dict) -> List[str]:
    """Validate status field."""
    errors = []

    if 'status' not in data:
        return errors

    status = data['status']

    if not isinstance(status, str):
        errors.append(f"Status must be a string, got: {type(status).__name__}")
    elif status.lower() not in VALID_STATUSES:
        errors.append(f"Invalid status '{status}' - valid values: {', '.join(sorted(VALID_STATUSES))}")

    return errors


def validate_future_confirmed(data: Dict) -> List[str]:
    """Check that confirmed events are not in the future."""
    errors = []

    if data.get('status') != 'confirmed':
        return errors

    date_str = str(data.get('date', ''))
    if not re.match(r'^\d{4}-\d{2}-\d{2}$', date_str):
        return errors

    try:
        event_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        today = datetime.now().date()
        if event_date > today and 'confirmed_date' not in data:
            errors.append(f"Future date {date_str} with 'confirmed' status (add 'confirmed_date' field or change status)")
    except ValueError:
        pass

    return errors


def validate_body(body: str, data: Dict) -> List[str]:
    """Validate event body content."""
    errors = []

    # Body can be short if there's a summary in frontmatter
    has_summary = 'summary' in data and data['summary'] and len(str(data['summary'])) > 50

    if not body or len(body.strip()) < 50:
        if not has_summary:
            errors.append("Event body is too short - should have detailed summary (min 50 chars)")

    return errors


def validate_event_file(filepath: Path, actor_aliases: Dict[str, str] = None) -> Tuple[bool, List[str]]:
    """
    Validate a single markdown event file.

    Returns:
        (is_valid, error_messages)
    """
    if actor_aliases is None:
        actor_aliases = {}

    all_errors = []

    # Skip non-event files
    if filepath.name.upper() == 'README.MD':
        return True, []

    if filepath.name.startswith('_'):
        return True, []  # Skip index/special files

    if filepath.suffix.lower() != '.md':
        return True, []  # Not a markdown file

    # Parse the file
    data, body, parse_errors = parse_markdown_event(filepath)
    if parse_errors:
        return False, parse_errors

    if data is None:
        return False, ["Failed to parse event file"]

    # Run all validations
    all_errors.extend(validate_required_fields(data, filepath))
    all_errors.extend(validate_id(data, filepath))
    all_errors.extend(validate_date(data))
    all_errors.extend(validate_importance(data))
    all_errors.extend(validate_actors(data, actor_aliases))
    all_errors.extend(validate_tags(data))
    all_errors.extend(validate_sources(data))
    all_errors.extend(validate_status(data))
    all_errors.extend(validate_future_confirmed(data))
    all_errors.extend(validate_body(body, data))

    return len(all_errors) == 0, all_errors


def get_staged_files() -> List[Path]:
    """Get list of staged markdown event files."""
    try:
        result = subprocess.run(
            ['git', 'diff', '--cached', '--name-only'],
            capture_output=True, text=True, check=True,
            cwd=SCRIPT_DIR.parent.parent
        )
        files = []
        for line in result.stdout.strip().split('\n'):
            if line.endswith('.md') and 'timeline/data/events/' in line:
                filepath = SCRIPT_DIR.parent.parent / line
                if filepath.exists():
                    files.append(filepath)
        return files
    except subprocess.CalledProcessError:
        return []


def main():
    import argparse

    parser = argparse.ArgumentParser(description='Validate markdown timeline events')
    parser.add_argument('files', nargs='*', help='Specific files to validate')
    parser.add_argument('--staged', action='store_true', help='Validate only staged files')
    parser.add_argument('--fix', action='store_true', help='Auto-fix simple issues (not implemented)')
    parser.add_argument('--quiet', '-q', action='store_true', help='Only show errors')
    args = parser.parse_args()

    # Load actor aliases for normalization check
    actor_aliases = load_actor_aliases()

    # Determine files to validate
    if args.staged:
        files = get_staged_files()
        if not files:
            print("✅ No staged event files to validate")
            return 0
    elif args.files:
        files = [Path(f) for f in args.files]
    else:
        files = sorted(EVENTS_DIR.glob('*.md'))

    if not files:
        print("No files to validate")
        return 0

    if not args.quiet:
        print(f"Validating {len(files)} markdown event files...\n")

    # Validate each file
    valid_count = 0
    error_count = 0
    files_with_errors = []

    for filepath in files:
        is_valid, errors = validate_event_file(filepath, actor_aliases)

        if is_valid:
            valid_count += 1
            if not args.quiet:
                print(f"✅ {filepath.name}")
        else:
            error_count += len(errors)
            files_with_errors.append(filepath.name)
            print(f"❌ {filepath.name}")
            for error in errors:
                print(f"   - {error}")

    # Summary
    print()
    if files_with_errors:
        print(f"❌ Validation failed: {error_count} errors in {len(files_with_errors)} files")
        return 1
    else:
        print(f"✅ All {valid_count} files are valid!")
        return 0


if __name__ == '__main__':
    sys.exit(main())
