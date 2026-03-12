#!/usr/bin/env python3
"""
Research Server CLI Client

Command-line interface for the Research Server API.
"""

import argparse
import requests
import json
import sys
import os

DEFAULT_URL = "http://localhost:5002"

def get_url():
    return os.environ.get("RESEARCH_SERVER_URL", DEFAULT_URL)

def print_json(data):
    print(json.dumps(data, indent=2))

def cmd_list(args):
    url = f"{get_url()}/api/standardization/actors"
    params = {
        'page': args.page,
        'limit': args.limit
    }
    if args.search:
        params['search'] = args.search
    if args.category:
        params['category'] = args.category
        
    try:
        r = requests.get(url, params=params)
        r.raise_for_status()
        data = r.json()
        
        if args.json:
            print_json(data)
            return

        print(f"Found {data['total']} actors (Page {data['page']}/{data['pages']})")
        print("-" * 50)
        for actor in data['actors']:
            aliases = f" ({actor['alias_count']} aliases)" if actor['alias_count'] else ""
            print(f"[{actor['id']}] {actor['canonical_name']} - {actor['category'] or 'No Category'}{aliases}")
            
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

def cmd_get(args):
    url = f"{get_url()}/api/standardization/actors/{args.id}"
    try:
        r = requests.get(url)
        r.raise_for_status()
        print_json(r.json())
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

def cmd_create(args):
    url = f"{get_url()}/api/standardization/actors"
    data = {
        'canonical_name': args.name,
        'category': args.category,
        'description': args.description,
        'notes': args.notes,
        'created_by': 'cli'
    }
    try:
        r = requests.post(url, json=data)
        r.raise_for_status()
        print(f"✅ Created actor with ID {r.json()['id']}")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

def cmd_add_alias(args):
    url = f"{get_url()}/api/standardization/actors/{args.id}/aliases"
    data = {
        'alias_name': args.alias,
        'source': 'cli'
    }
    try:
        r = requests.post(url, json=data)
        r.raise_for_status()
        print(f"✅ Added alias '{args.alias}'")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

def cmd_stats(args):
    url = f"{get_url()}/api/standardization/stats"
    try:
        r = requests.get(url)
        r.raise_for_status()
        print_json(r.json())
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

def cmd_events(args):
    url = f"{get_url()}/api/timeline/events"
    params = {
        'page': args.page,
        'limit': args.limit
    }
    if args.search:
        params['search'] = args.search
        
    try:
        r = requests.get(url, params=params)
        r.raise_for_status()
        data = r.json()
        
        if args.json:
            print_json(data)
            return

        print(f"Found {data['total']} events (Page {data['page']}/{data['pages']})")
        print("-" * 50)
        for event in data['events']:
            date = event.get('date', 'YYYY-MM-DD')
            title = event.get('title', 'No Title')
            print(f"[{date}] {title} ({event.get('id')})")
            
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description="Research Server CLI")
    subparsers = parser.add_subparsers(dest="command", help="Command to run")
    
    # List
    list_parser = subparsers.add_parser("list", help="List actors")
    list_parser.add_argument("--search", "-s", help="Search term")
    list_parser.add_argument("--category", "-c", help="Filter by category")
    list_parser.add_argument("--page", "-p", type=int, default=1, help="Page number")
    list_parser.add_argument("--limit", "-l", type=int, default=20, help="Items per page")
    list_parser.add_argument("--json", action="store_true", help="Output in JSON format")
    
    # Get
    get_parser = subparsers.add_parser("get", help="Get actor details")
    get_parser.add_argument("id", type=int, help="Actor ID")
    
    # Create
    create_parser = subparsers.add_parser("create", help="Create new actor")
    create_parser.add_argument("name", help="Canonical Name")
    create_parser.add_argument("--category", "-c", help="Category")
    create_parser.add_argument("--description", "-d", help="Description")
    create_parser.add_argument("--notes", "-n", help="Notes")
    
    # Add Alias
    alias_parser = subparsers.add_parser("alias", help="Add alias to actor")
    alias_parser.add_argument("id", type=int, help="Actor ID")
    alias_parser.add_argument("alias", help="Alias name")
    
    # Stats
    subparsers.add_parser("stats", help="Get statistics")
    
    # Events
    events_parser = subparsers.add_parser("events", help="List timeline events")
    events_parser.add_argument("--search", "-s", help="Search term")
    events_parser.add_argument("--page", "-p", type=int, default=1, help="Page number")
    events_parser.add_argument("--limit", "-l", type=int, default=20, help="Items per page")
    events_parser.add_argument("--json", action="store_true", help="Output in JSON format")

    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        sys.exit(1)
        
    commands = {
        'list': cmd_list,
        'get': cmd_get,
        'create': cmd_create,
        'alias': cmd_add_alias,
        'stats': cmd_stats,
        'events': cmd_events
    }
    
    if args.command in commands:
        commands[args.command](args)

if __name__ == "__main__":
    main()
