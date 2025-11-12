#!/bin/bash
#
# Research Monitor v2 - Server Startup Script
# Loads configuration from .env file and starts the server
#

# Change to server directory
cd "$(dirname "$0")"

# Load .env file
if [ -f .env ]; then
    echo "Loading configuration from .env file..."
    export $(cat .env | grep -v '^#' | grep -v '^$' | xargs)
else
    echo "Warning: .env file not found, using environment variables"
fi

# Display configuration
echo ""
echo "Research Monitor v2 Configuration:"
echo "  Timeline Repo: $TIMELINE_REPO_URL"
echo "  Workspace: $TIMELINE_WORKSPACE"
echo "  Port: $RESEARCH_MONITOR_PORT"
echo ""

# Start server
echo "Starting Research Monitor v2..."
python3 app_v2.py
