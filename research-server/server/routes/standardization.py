"""
Actor Standardization API Routes

Flask Blueprint for managing actor standardizations.
"""

from flask import Blueprint, request, jsonify
from services.standardization_service import StandardizationService
import os
from pathlib import Path

# Create blueprint
standardization_bp = Blueprint('standardization', __name__, url_prefix='/api/standardization')

# Initialize service
DB_PATH = os.getenv('DB_PATH', str(Path(__file__).parent.parent / 'unified_research.db'))
service = StandardizationService(DB_PATH)


# ==================== Actor Standardizations ====================

@standardization_bp.route('/actors', methods=['GET'])
def list_actors():
    """
    List actors with pagination.

    Query params:
        - category: Filter by category
        - search: Search canonical names
        - page: Page number (default 1)
        - limit: Items per page (default 20)
    """
    try:
        category = request.args.get('category')
        search = request.args.get('search')
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))

        actors, total = service.list_actors(
            category=category,
            search=search,
            page=page,
            limit=limit
        )

        return jsonify({
            'actors': actors,
            'total': total,
            'page': page,
            'per_page': limit,
            'pages': (total + limit - 1) // limit
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@standardization_bp.route('/actors', methods=['POST'])
def create_actor():
    """
    Create a new canonical actor.

    Body:
        - canonical_name: Name (required)
        - category: Category (optional)
        - description: Description (optional)
        - notes: Notes (optional)
    """
    try:
        data = request.get_json()

        if not data.get('canonical_name'):
            return jsonify({'error': 'canonical_name is required'}), 400

        actor_id = service.create_actor(
            canonical_name=data['canonical_name'],
            category=data.get('category'),
            description=data.get('description'),
            notes=data.get('notes'),
            created_by=data.get('created_by', 'web-ui')
        )

        return jsonify({
            'id': actor_id,
            'message': 'Actor created successfully'
        }), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@standardization_bp.route('/actors/<int:actor_id>', methods=['GET'])
def get_actor(actor_id):
    """Get actor by ID with aliases."""
    try:
        actor = service.get_actor(actor_id)

        if not actor:
            return jsonify({'error': 'Actor not found'}), 404

        return jsonify(actor)

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@standardization_bp.route('/actors/<int:actor_id>', methods=['PUT'])
def update_actor(actor_id):
    """
    Update actor details.

    Body can include: canonical_name, category, description, notes
    """
    try:
        data = request.get_json()

        success = service.update_actor(actor_id, **data)

        if not success:
            return jsonify({'error': 'Actor not found or no changes'}), 404

        return jsonify({'message': 'Actor updated successfully'})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@standardization_bp.route('/actors/<int:actor_id>', methods=['DELETE'])
def delete_actor(actor_id):
    """Delete actor (cascades to aliases)."""
    try:
        success = service.delete_actor(actor_id)

        if not success:
            return jsonify({'error': 'Actor not found'}), 404

        return jsonify({'message': 'Actor deleted successfully'})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== Aliases ====================

@standardization_bp.route('/actors/<int:actor_id>/aliases', methods=['POST'])
def add_alias(actor_id):
    """
    Add alias to canonical actor.

    Body:
        - alias_name: Alias name (required)
        - confidence: Confidence score 0-1 (default 1.0)
        - source: Source identifier (default 'manual')
    """
    try:
        data = request.get_json()

        if not data.get('alias_name'):
            return jsonify({'error': 'alias_name is required'}), 400

        alias_id = service.add_alias(
            canonical_id=actor_id,
            alias_name=data['alias_name'],
            confidence=data.get('confidence', 1.0),
            source=data.get('source', 'manual')
        )

        return jsonify({
            'id': alias_id,
            'message': 'Alias added successfully'
        }), 201

    except Exception as e:
        if 'UNIQUE constraint failed' in str(e):
            return jsonify({'error': 'Alias already exists'}), 409
        return jsonify({'error': str(e)}), 500


@standardization_bp.route('/aliases/<int:alias_id>', methods=['DELETE'])
def remove_alias(alias_id):
    """Remove an alias."""
    try:
        success = service.remove_alias(alias_id)

        if not success:
            return jsonify({'error': 'Alias not found'}), 404

        return jsonify({'message': 'Alias removed successfully'})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== Suggestions ====================

@standardization_bp.route('/suggestions', methods=['GET'])
def get_suggestions():
    """
    Get standardization suggestions.

    Query params:
        - status: pending|approved|rejected (default: pending)
        - min_confidence: Minimum confidence score (default: 0.0)
    """
    try:
        status = request.args.get('status', 'pending')
        min_confidence = float(request.args.get('min_confidence', 0.0))

        suggestions = service.get_suggestions(status=status, min_confidence=min_confidence)

        return jsonify({
            'suggestions': suggestions,
            'count': len(suggestions)
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@standardization_bp.route('/suggestions/<int:suggestion_id>/review', methods=['POST'])
def review_suggestion(suggestion_id):
    """
    Review a suggestion.

    Body:
        - action: 'approved' or 'rejected' (required)
        - reviewed_by: Reviewer identifier (default: 'web-ui')
    """
    try:
        data = request.get_json()

        action = data.get('action')
        if action not in ['approved', 'rejected']:
            return jsonify({'error': 'action must be approved or rejected'}), 400

        success = service.review_suggestion(
            suggestion_id=suggestion_id,
            action=action,
            reviewed_by=data.get('reviewed_by', 'web-ui')
        )

        if not success:
            return jsonify({'error': 'Suggestion not found'}), 404

        return jsonify({'message': f'Suggestion {action}'})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== Application History ====================

@standardization_bp.route('/history', methods=['GET'])
def get_history():
    """
    Get standardization application history.

    Query params:
        - batch_id: Filter by batch
        - event_id: Filter by event
        - limit: Max results (default: 100)
    """
    try:
        batch_id = request.args.get('batch_id')
        event_id = request.args.get('event_id')
        limit = int(request.args.get('limit', 100))

        history = service.get_application_history(
            batch_id=batch_id,
            event_id=event_id,
            limit=limit
        )

        return jsonify({
            'history': history,
            'count': len(history)
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== Stats ====================

@standardization_bp.route('/stats', methods=['GET'])
def get_stats():
    """Get standardization statistics."""
    try:
        stats = service.get_stats()
        return jsonify(stats)

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== Import/Export ====================

@standardization_bp.route('/import', methods=['POST'])
def import_rules():
    """
    Import standardization rules from scripts.

    Body:
        - standardizations: Dict mapping alias -> canonical
        - category: Category for imported actors (default: 'imported')
        - source: Source identifier (default: 'script')
    """
    try:
        data = request.get_json()

        if not data.get('standardizations'):
            return jsonify({'error': 'standardizations dict is required'}), 400

        stats = service.import_from_dict(
            standardizations=data['standardizations'],
            category=data.get('category', 'imported'),
            source=data.get('source', 'script')
        )

        return jsonify({
            'message': 'Import completed',
            'stats': stats
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@standardization_bp.route('/export', methods=['GET'])
def export_rules():
    """
    Export standardization rules as dict.

    Returns dict mapping lowercase alias -> Canonical Name
    """
    try:
        mapping = service.export_to_dict()

        return jsonify({
            'standardizations': mapping,
            'count': len(mapping)
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Error handlers
@standardization_bp.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404


@standardization_bp.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500
