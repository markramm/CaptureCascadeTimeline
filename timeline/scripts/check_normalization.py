#!/usr/bin/env python3
"""
Check for normalization issues in timeline events.
Returns non-zero exit code if issues found.

Usage:
    python scripts/check_normalization.py           # Check all files
    python scripts/check_normalization.py --staged  # Check only staged files
"""

import os
import sys
import json
import yaml
import re
import subprocess
from pathlib import Path
from collections import Counter, defaultdict

SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR.parent / "data"
EVENTS_DIR = DATA_DIR / "events"
ALIASES_FILE = DATA_DIR / "actor_aliases.json"


def load_actor_aliases():
    """Load actor alias mapping (alias -> canonical)."""
    if not ALIASES_FILE.exists():
        return {}

    with open(ALIASES_FILE) as f:
        canonical_to_aliases = json.load(f)

    alias_to_canonical = {}
    for canonical, aliases in canonical_to_aliases.items():
        for alias in aliases:
            alias_to_canonical[alias] = canonical

    return alias_to_canonical


def get_staged_files():
    """Get list of staged markdown files."""
    result = subprocess.run(
        ['git', 'diff', '--cached', '--name-only'],
        capture_output=True, text=True, cwd=SCRIPT_DIR.parent.parent
    )
    files = []
    for line in result.stdout.strip().split('\n'):
        if line.endswith('.md') and 'timeline/data/events/' in line:
            # Convert relative path to absolute
            filepath = SCRIPT_DIR.parent.parent / line
            if filepath.exists():
                files.append(filepath)
    return files


def check_file(filepath, actor_aliases):
    """Check a single file for normalization issues."""
    issues = []

    with open(filepath, 'r') as f:
        content = f.read()

    if not content.startswith('---'):
        return issues

    parts = content.split('---', 2)
    if len(parts) < 3:
        return issues

    try:
        frontmatter = yaml.safe_load(parts[1])
    except yaml.YAMLError as e:
        issues.append(f"YAML parse error: {e}")
        return issues

    # Check for JSON files (should be markdown)
    if filepath.suffix == '.json':
        issues.append("Event should be in markdown format, not JSON")

    # Check actors
    for actor in frontmatter.get('actors', []) or []:
        if actor in actor_aliases:
            issues.append(f"Actor '{actor}' should be '{actor_aliases[actor]}'")

    # Check tags (should be lowercase)
    for tag in frontmatter.get('tags', []) or []:
        if tag and isinstance(tag, str) and tag != tag.lower():
            issues.append(f"Tag '{tag}' should be lowercase: '{tag.lower()}'")

    # Check sources
    for source in frontmatter.get('sources', []) or []:
        if not source:
            continue
        # Check for missing required fields
        if 'url' not in source:
            issues.append("Source missing 'url' field")
        if 'title' not in source:
            issues.append("Source missing 'title' field")
        # Check for old 'publisher' field (should be 'outlet')
        if 'publisher' in source and 'outlet' not in source:
            issues.append(f"Source uses 'publisher' instead of 'outlet'")

    # Check status values
    valid_statuses = {'confirmed', 'reported', 'disputed', 'developing'}
    status = frontmatter.get('status')
    if status and status.lower() not in valid_statuses:
        issues.append(f"Status '{status}' may need review (valid: {', '.join(sorted(valid_statuses))})")

    # Check importance (should be 1-10)
    importance = frontmatter.get('importance')
    if importance is not None:
        if not isinstance(importance, int) or importance < 1 or importance > 10:
            issues.append(f"Importance '{importance}' should be integer 1-10")

    return issues


def main():
    staged_only = '--staged' in sys.argv
    actor_aliases = load_actor_aliases()

    if staged_only:
        files = get_staged_files()
        if not files:
            print("No staged event files to check")
            return 0
        print(f"Checking {len(files)} staged files for normalization issues...")
    else:
        files = list(EVENTS_DIR.glob('*.md'))
        print(f"Checking {len(files)} files for normalization issues...")

    all_issues = {}

    for filepath in files:
        issues = check_file(filepath, actor_aliases)
        if issues:
            all_issues[filepath.name] = issues

    if all_issues:
        print(f"\n❌ Found normalization issues in {len(all_issues)} files:\n")
        for filename, issues in sorted(all_issues.items()):
            print(f"{filename}:")
            for issue in issues:
                print(f"  - {issue}")
            print()

        print("Run the following to fix:")
        print("  python3 timeline/scripts/normalize_actors.py --apply")
        print("  python3 timeline/scripts/normalize_tags.py --apply")
        print("  python3 timeline/scripts/normalize_outlets.py --apply")
        return 1
    else:
        print("✅ No normalization issues found")
        return 0


if __name__ == '__main__':
    sys.exit(main())
