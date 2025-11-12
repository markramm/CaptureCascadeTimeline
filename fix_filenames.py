#!/usr/bin/env python3
"""Rename event files to match their internal IDs."""

import json
import os
from pathlib import Path

events_dir = Path("timeline/data/events")

# Find all JSON files with mismatched names
for filepath in events_dir.glob("*.json"):
    with open(filepath, 'r') as f:
        try:
            data = json.load(f)
            event_id = data.get('id')

            if event_id:
                expected_filename = f"{event_id}.json"
                actual_filename = filepath.name

                if expected_filename != actual_filename:
                    new_path = filepath.parent / expected_filename
                    print(f"Renaming: {actual_filename} -> {expected_filename}")
                    filepath.rename(new_path)
        except json.JSONDecodeError:
            print(f"Error reading {filepath}")
            continue

print("\nDone!")
