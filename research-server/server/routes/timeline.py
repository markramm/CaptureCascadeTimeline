
from flask import Blueprint, request, jsonify
from services.timeline_service import TimelineService
import os
from pathlib import Path

# Create blueprint
timeline_bp = Blueprint('timeline', __name__, url_prefix='/api/timeline')

# Initialize service
EVENTS_PATH = os.getenv('EVENTS_PATH', str(Path(__file__).parent.parent.parent.parent / 'timeline' / 'data' / 'events'))
service = TimelineService(EVENTS_PATH)

@timeline_bp.route('/events', methods=['GET'])
def list_events():
    """
    List events.
    Query params: search, start_date, end_date, page, limit
    """
    try:
        search = request.args.get('search')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))

        events, total = service.list_events(
            search=search,
            start_date=start_date,
            end_date=end_date,
            page=page,
            limit=limit
        )

        return jsonify({
            'events': events,
            'total': total,
            'page': page,
            'limit': limit,
            'pages': (total + limit - 1) // limit
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@timeline_bp.route('/events/<event_id>', methods=['GET'])
def get_event(event_id):
    """Get single event."""
    try:
        event = service.get_event(event_id)
        if not event:
            return jsonify({'error': 'Event not found'}), 404
        return jsonify(event)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
