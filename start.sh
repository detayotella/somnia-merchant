#!/bin/bash

# Somnia Merchant NPC - Full Stack Startup Script
# This script starts all components of the AI merchant system

echo "🚀 Starting Somnia Merchant NPC System..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if tmux is available
if ! command -v tmux &> /dev/null; then
    echo -e "${YELLOW}⚠️  tmux not found. Install with: sudo apt install tmux${NC}"
    echo "Starting components in background instead..."
    
    # Start API server
    echo -e "${BLUE}Starting FastAPI status server...${NC}"
    cd ai_agent && python api_server.py > ../logs/api_server.log 2>&1 &
    API_PID=$!
    
    # Start AI agent
    echo -e "${BLUE}Starting AI agent...${NC}"
    python agent.py > ../logs/agent.log 2>&1 &
    AGENT_PID=$!
    cd ..
    
    # Start frontend
    echo -e "${BLUE}Starting Next.js frontend...${NC}"
    cd frontend && pnpm dev > ../logs/frontend.log 2>&1 &
    FRONTEND_PID=$!
    cd ..
    
    echo ""
    echo -e "${GREEN}✅ All components started!${NC}"
    echo ""
    echo "Process IDs:"
    echo "  API Server: $API_PID"
    echo "  AI Agent: $AGENT_PID"
    echo "  Frontend: $FRONTEND_PID"
    echo ""
    echo "Logs:"
    echo "  API Server: logs/api_server.log"
    echo "  AI Agent: logs/agent.log"
    echo "  Frontend: logs/frontend.log"
    echo ""
    echo "To stop: kill $API_PID $AGENT_PID $FRONTEND_PID"
    
else
    # Use tmux for better management
    SESSION="somnia-merchant"
    
    # Kill existing session if it exists
    tmux kill-session -t $SESSION 2>/dev/null
    
    # Create new session
    echo -e "${BLUE}Creating tmux session: $SESSION${NC}"
    tmux new-session -d -s $SESSION -n "api-server"
    
    # Window 1: API Server
    tmux send-keys -t $SESSION:api-server "cd ai_agent && python api_server.py" C-m
    
    # Window 2: AI Agent
    tmux new-window -t $SESSION -n "ai-agent"
    tmux send-keys -t $SESSION:ai-agent "cd ai_agent && python agent.py" C-m
    
    # Window 3: Frontend
    tmux new-window -t $SESSION -n "frontend"
    tmux send-keys -t $SESSION:frontend "cd frontend && pnpm dev" C-m
    
    echo ""
    echo -e "${GREEN}✅ All components started in tmux session!${NC}"
    echo ""
    echo "Usage:"
    echo -e "  ${BLUE}tmux attach -t $SESSION${NC}  - Attach to session"
    echo "  Ctrl+B, W                - List windows"
    echo "  Ctrl+B, N                - Next window"
    echo "  Ctrl+B, P                - Previous window"
    echo "  Ctrl+B, D                - Detach (keeps running)"
    echo ""
    echo -e "  ${YELLOW}tmux kill-session -t $SESSION${NC}  - Stop all components"
    echo ""
    
    # Auto-attach
    sleep 2
    echo -e "${BLUE}Attaching to session...${NC}"
    tmux attach -t $SESSION
fi
