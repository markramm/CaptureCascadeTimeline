
import os
import json
import frontmatter
from pathlib import Path
from typing import List, Dict, Optional, Tuple
from datetime import datetime

class TimelineService:
    """
    Read-only service to access timeline events from the filesystem.
    Supports both .json and .md files (with frontmatter).
    """

    def __init__(self, events_path: str):
        self.events_path = Path(events_path)

    def _parse_event_file(self, file_path: Path) -> Optional[Dict]:
        """Parse a single event file."""
        try:
            if file_path.suffix == '.json':
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    data['file_path'] = str(file_path)
                    # Ensure ID matches filename convention if not present
                    if 'id' not in data:
                        data['id'] = file_path.stem
                    return data
            elif file_path.suffix == '.md':
                post = frontmatter.load(file_path)
                data = post.metadata
                data['summary'] = post.content
                data['file_path'] = str(file_path)
                # Ensure ID from filename
                if 'id' not in data:
                    data['id'] = file_path.stem
                if 'date' not in data:
                     # Try to parse date from filename YYYY-MM-DD
                     parts = file_path.stem.split('--')
                     if len(parts) > 0:
                         data['date'] = parts[0]
                return data
            return None
        except Exception as e:
            print(f"Error parsing {file_path}: {e}")
            return None

    def list_events(self, search: Optional[str] = None, 
                   start_date: Optional[str] = None,
                   end_date: Optional[str] = None,
                   page: int = 1, limit: int = 20) -> Tuple[List[Dict], int]:
        """
        List events with filtering and pagination.
        This implementation currently does a full scan (inefficient for huge datasets but fine for <10k files).
        For production, we'd want an index or database cache (like the legacy system had).
        """
        all_events = []
        
        # Scan directory
        if not self.events_path.exists():
            return [], 0

        # Gather files
        files = sorted(list(self.events_path.glob('*.json')) + list(self.events_path.glob('*.md')))
        
        # Simplistic filtering - optimizing by date in filename if possible
        # For now, just parse all to be safe and sort
        
        # Performance shortcut: If no search, we can sorting file names (since they start with date)
        # to implement pagination efficiently without parsing everything? 
        # Yes, if we trust filename format YYYY-MM-DD--slug
        
        filtered_files = files
        
        # Date filtering on filename (fast)
        if start_date or end_date:
            filtered_files = []
            for f in files:
                date_str = f.stem.split('--')[0]
                # Simple string comparison works for ISO dates
                if start_date and date_str < start_date:
                    continue
                if end_date and date_str > end_date:
                    continue
                filtered_files.append(f)
        
        # If we need to search content, we must parse. 
        # If not, we can paginate THEN parse.
        
        if search:
            # Full scan required
            results = []
            for f in filtered_files:
                evt = self._parse_event_file(f)
                if evt:
                    # Search text
                    blob = json.dumps(evt).lower()
                    if search.lower() in blob:
                        results.append(evt)
            
            # Sort by date descending (newest first) usually? Or ascending?
            # Timeline usually ascending.
            results.sort(key=lambda x: x.get('date', ''), reverse=True) 
            total = len(results)
            
            # Paginate
            start = (page - 1) * limit
            end = start + limit
            return results[start:end], total
            
        else:
            # Metadata only scan (fast)
            # Sort by filename desc (newest first) or asc?
            # Let's say newest first
            filtered_files.sort(key=lambda x: x.name, reverse=True)
            
            total = len(filtered_files)
            start = (page - 1) * limit
            end = start + limit
            
            page_files = filtered_files[start:end]
            results = [self._parse_event_file(f) for f in page_files]
            # Filter checks again just in case parse failed
            results = [r for r in results if r]
            
            return results, total

    def get_event(self, event_id: str) -> Optional[Dict]:
        """Get a single event by ID."""
        # Try json
        f = self.events_path / f"{event_id}.json"
        if f.exists():
            return self._parse_event_file(f)
        
        # Try md
        f = self.events_path / f"{event_id}.md"
        if f.exists():
            return self._parse_event_file(f)
            
        return None
