#!/bin/bash

# Setup script for AI Agent environment
echo "🔧 Setting up AI Agent Python environment..."

cd ai_agent

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate and install dependencies
echo "Installing dependencies..."
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

echo ""
echo "✅ Setup complete!"
echo ""
echo "To activate the environment:"
echo "  cd ai_agent && source venv/bin/activate"
echo ""
echo "To start the API server:"
echo "  python api_server.py"
echo ""
echo "To start the AI agent:"
echo "  python agent.py"
