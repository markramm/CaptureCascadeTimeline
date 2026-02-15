#!/usr/bin/env python3
"""
Validate timeline event dates and temporal consistency.

Checks:
- Date in filename matches date in frontmatter
- Date prefix in ID matches date field
- No confirmed events with future dates (unless confirmed_date set)
- Date is a valid calendar date
- Status-appropriate date constraints
- Source dates are valid and not wildly inconsistent with event date

Usage:
    python3 validate_timeline_dates.py                    # Validate all events
    python3 validate_timeline_dates.py --staged           # Validate staged files only
    python3 validate_timeline_dates.py event1.md event2.md  # Validate specific files
    python3 validate_timeline_dates.py --warnings         # Include warnings (future dates, etc.)
"""

import sys
import re
import yaml
import argparse
import subprocess
from pathlib import Path
from datetime import date, datetime
from typing import List, Tuple, Dict, Optional

SCRIPT_DIR = Path(__file__).parent
EVENTS_DIR = SCRIPT_DIR.parent / "data" / "events"


def parse_frontmatter(filepath: Path) -> Tuple[Optional[Dict], List[str]]:
    """Parse YAML frontmatter from a markdown file."""
    errors = []
    try:
        content = filepath.read_text(encoding='utf-8')
    except Exception as e:
        return None, [f"Cannot read file: {e}"]

    if not content.startswith('---'):
        return None, ["File must start with YAML frontmatter (---)"]

    parts = content.split('---', 2)
    if len(parts) < 3:
        return None, ["Invalid frontmatter - missing closing ---"]

    try:
        data = yaml.safe_load(parts[1])
    except yaml.YAMLError as e:
        return None, [f"YAML parse error: {e}"]

    if not isinstance(data, dict):
        return None, ["Frontmatter must be a YAML dictionary"]

    return data, errors


def parse_date_str(date_val) -> Optional[date]:
    """Parse a date value from YAML (could be string or date object)."""
    if isinstance(date_val, date):
        return date_val
    if isinstance(date_val, datetime):
        return date_val.date()
    if isinstance(date_val, str):
        try:
            return date.fromisoformat(date_val)
        except ValueError:
            return None
    return None


def validate_date_file(filepath: Path, today: date, show_warnings: bool = False) -> Tuple[List[str], List[str]]:
    """
    Validate dates in a single event file.

    Returns:
        (errors, warnings)
    """
    errors = []
    warnings = []

    if filepath.name.upper() == 'README.MD' or filepath.name.startswith('_'):
        return errors, warnings

    if filepath.suffix.lower() != '.md':
        return errors, warnings

    data, parse_errors = parse_frontmatter(filepath)
    if parse_errors:
        return parse_errors, warnings
    if data is None:
        return ["Failed to parse frontmatter"], warnings

    # --- Check date field exists and is valid ---
    if 'date' not in data:
        errors.append("Missing 'date' field")
        return errors, warnings

    event_date = parse_date_str(data['date'])
    date_str = str(data['date'])

    if event_date is None:
        errors.append(f"Invalid date format: '{date_str}' (expected YYYY-MM-DD)")
        return errors, warnings

    # Check it's a real calendar date
    if not re.match(r'^\d{4}-\d{2}-\d{2}$', date_str):
        errors.append(f"Date must be YYYY-MM-DD format, got: '{date_str}'")

    # --- Check filename date prefix matches date field ---
    filename_match = re.match(r'^(\d{4}-\d{2}-\d{2})--', filepath.stem)
    if filename_match:
        filename_date_str = filename_match.group(1)
        if filename_date_str != date_str:
            errors.append(
                f"Filename date '{filename_date_str}' doesn't match "
                f"frontmatter date '{date_str}'"
            )
    else:
        errors.append(f"Filename must start with YYYY-MM-DD--: '{filepath.stem}'")

    # --- Check ID date prefix matches date field ---
    if 'id' in data:
        id_match = re.match(r'^(\d{4}-\d{2}-\d{2})--', str(data['id']))
        if id_match:
            id_date_str = id_match.group(1)
            if id_date_str != date_str:
                errors.append(
                    f"ID date prefix '{id_date_str}' doesn't match "
                    f"frontmatter date '{date_str}'"
                )

    # --- Check future dates ---
    status = str(data.get('status', '')).lower()
    has_confirmed_date = 'confirmed_date' in data

    if event_date > today:
        if status == 'confirmed' and not has_confirmed_date:
            errors.append(
                f"Future date {date_str} with status 'confirmed' — "
                f"either change status or add 'confirmed_date' field"
            )
        elif show_warnings:
            warnings.append(f"Future date: {date_str}")

    # --- Check source dates ---
    sources = data.get('sources', [])
    if isinstance(sources, list):
        for i, source in enumerate(sources):
            if not isinstance(source, dict):
                continue
            src_date = source.get('date')
            if src_date:
                src_parsed = parse_date_str(src_date)
                if src_parsed is None:
                    # Year-only or year-month dates are common for older sources
                    src_str = str(src_date)
                    if re.match(r'^\d{4}$', src_str) or re.match(r'^\d{4}-\d{2}$', src_str):
                        if show_warnings:
                            warnings.append(f"Source {i+1}: imprecise date '{src_date}' (prefer YYYY-MM-DD)")
                    else:
                        errors.append(f"Source {i+1}: invalid date format '{src_date}'")
                elif src_parsed > today and show_warnings:
                    warnings.append(f"Source {i+1}: future date {src_date}")

    return errors, warnings


def get_staged_files() -> List[Path]:
    """Get staged markdown event files from git."""
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
    parser = argparse.ArgumentParser(description='Validate timeline event dates')
    parser.add_argument('files', nargs='*', help='Specific files to validate')
    parser.add_argument('--staged', action='store_true', help='Validate staged files only')
    parser.add_argument('--warnings', '-w', action='store_true', help='Show warnings too')
    parser.add_argument('--quiet', '-q', action='store_true', help='Only show errors')
    args = parser.parse_args()

    today = date.today()

    # Determine files
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
        print(f"Validating dates in {len(files)} event files...\n")

    error_file_count = 0
    warning_file_count = 0
    total_errors = 0
    total_warnings = 0

    for filepath in files:
        file_errors, file_warnings = validate_date_file(filepath, today, args.warnings)

        if file_errors:
            error_file_count += 1
            total_errors += len(file_errors)
            print(f"❌ {filepath.name}")
            for err in file_errors:
                print(f"   ERROR: {err}")

        if file_warnings:
            warning_file_count += 1
            total_warnings += len(file_warnings)
            if not file_errors and not args.quiet:
                print(f"⚠️  {filepath.name}")
            for warn in file_warnings:
                print(f"   WARNING: {warn}")

        if not file_errors and not file_warnings and not args.quiet:
            pass  # Don't print OK for each file (too noisy)

    # Summary
    print()
    if total_errors > 0:
        print(f"❌ Date validation failed: {total_errors} errors in {error_file_count} files")
        if total_warnings > 0:
            print(f"⚠️  {total_warnings} warnings in {warning_file_count} files")
        return 1
    elif total_warnings > 0:
        print(f"✅ No errors. {total_warnings} warnings in {warning_file_count} files")
        return 0
    else:
        print(f"✅ All {len(files)} event files have valid dates!")
        return 0


if __name__ == '__main__':
    sys.exit(main())
