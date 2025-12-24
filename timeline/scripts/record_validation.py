
import argparse
import json
import os
import datetime
from pathlib import Path
from typing import List, Dict, Any

VALIDATIONS_DIR = Path(__file__).parent.parent / 'data/validations'
VALIDATORS_DIR = VALIDATIONS_DIR / 'validators'
EVENTS_DIR = Path(__file__).parent.parent / 'data/events'

def init_validator(args):
    """Initialize a new validator identity."""
    v_dir = VALIDATORS_DIR / args.id
    if v_dir.exists():
        print(f"Validator '{args.id}' already exists.")
        return

    v_dir.mkdir(parents=True)
    (v_dir / 'records').mkdir()

    manifest = {
        "id": args.id,
        "type": args.type,
        "name": args.name or args.id,
        "trust_level": "automated" if args.type == "ai" else "expert",
        "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }

    with open(v_dir / 'manifest.json', 'w') as f:
        json.dump(manifest, f, indent=2)
    
    print(f"Created validator '{args.id}' at {v_dir}")

def record_validation(args):
    """Record a validation for an event."""
    if not (VALIDATORS_DIR / args.validator).exists():
        print(f"Error: Validator '{args.validator}' does not exist. Run init-validator first.")
        return

    # Verify event exists
    event_path = EVENTS_DIR / f"{args.event_id}.json"
    if not event_path.exists():
        print(f"Warning: Event '{args.event_id}' not found in data/events. Recording anyway.")

    record_dir = VALIDATORS_DIR / args.validator / 'records'
    today = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%d')
    record_file = record_dir / f"{today}.json"

    validation_entry = {
        "event_id": args.event_id,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "type": args.valid_type,
        "confidence": args.confidence,
        "notes": args.notes,
        "sources_checked": [] # Extensions can add this
    }

    data = {"validator_id": args.validator, "validations": []}
    
    if record_file.exists():
        try:
            with open(record_file, 'r') as f:
                data = json.load(f)
        except json.JSONDecodeError:
            pass # Start fresh if corrupted

    data["validations"].append(validation_entry)

    with open(record_file, 'w') as f:
        json.dump(data, f, indent=2)

    print(f"Recorded validation for {args.event_id} in {record_file}")

def find_unvalidated(args):
    """List events that have no validation records."""
    # 1. Gather all validated event IDs
    validated_ids = set()
    for v_dir in VALIDATORS_DIR.iterdir():
        if not v_dir.is_dir(): continue
        records_dir = v_dir / 'records'
        if not records_dir.exists(): continue
        
        for r_file in records_dir.glob('*.json'):
            try:
                with open(r_file, 'r') as f:
                    data = json.load(f)
                    for v in data.get('validations', []):
                        validated_ids.add(v['event_id'])
            except:
                continue
    
    # 2. Check all events
    count = 0
    print(f"--- Unvalidated Events (Limit: {args.limit}) ---")
    
    # Load all events (memory intensive if huge, but fine for now)
    # Alternatively, list dir
    all_events = sorted(list(EVENTS_DIR.glob('*.json')))
    
    for e_file in all_events:
        e_ind = e_file.stem
        if e_ind not in validated_ids:
            print(e_ind)
            count += 1
            if count >= args.limit:
                break
    
    if count == 0:
        print("All events validated!")

def main():
    parser = argparse.ArgumentParser(description="Timeline Validation Manager")
    subparsers = parser.add_subparsers(dest='command', required=True)

    # Init
    p_init = subparsers.add_parser('init-validator', help='Register a new validator')
    p_init.add_argument('id', help='Unique validator ID')
    p_init.add_argument('--type', choices=['ai', 'human', 'bot'], default='human')
    p_init.add_argument('--name', help='Display name')
    p_init.set_defaults(func=init_validator)

    # Record
    p_rec = subparsers.add_parser('record', help='Record a validation')
    p_rec.add_argument('event_id', help='Event ID to validate')
    p_rec.add_argument('--validator', required=True, help='Validator ID')
    p_rec.add_argument('--confidence', choices=['high', 'medium', 'low', 'rejected'], default='high')
    p_rec.add_argument('--valid-type', choices=['source', 'factual', 'cross-reference'], default='source')
    p_rec.add_argument('--notes', default='')
    p_rec.set_defaults(func=record_validation)

    # Unvalidated
    p_un = subparsers.add_parser('unvalidated', help='Find unvalidated events')
    p_un.add_argument('--limit', type=int, default=20)
    p_un.set_defaults(func=find_unvalidated)

    args = parser.parse_args()
    args.func(args)

if __name__ == "__main__":
    main()
