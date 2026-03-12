from flask import Flask, jsonify
from flask_cors import CORS
from routes.standardization import standardization_bp
from routes.timeline import timeline_bp
import os

app = Flask(__name__)
CORS(app)

# Register Blueprints
app.register_blueprint(standardization_bp)
app.register_blueprint(timeline_bp)

@app.route('/health')
def health_check():
    return jsonify({"status": "healthy", "service": "research-monitor-v2"})

if __name__ == '__main__':
    port = int(os.environ.get('RESEARCH_MONITOR_PORT', 5002))
    app.run(host='0.0.0.0', port=port, debug=True)