"use client";

import { useEffect, useState } from "react";
import { Brain, Activity, Zap, TrendingUp, Clock, Wallet } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AgentDecision {
  timestamp: string;
  action: string;
  merchant_id: number;
  details: Record<string, any>;
  reasoning: string;
}

interface AgentStatus {
  is_running: boolean;
  last_poll_time: string | null;
  agent_address: string;
  wallet_balance_eth: number;
  total_decisions_made: number;
  recent_decisions: AgentDecision[];
  merchants_monitored: number;
  auto_trading_enabled: boolean;
  connection_healthy: boolean;
  uptime_seconds: number;
}

const API_URL = "http://localhost:8000";

export function AIAgentStatus() {
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(`${API_URL}/api/agent/status`);
        if (!response.ok) {
          throw new Error("Agent API unavailable");
        }
        const data = await response.json();
        setStatus(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to connect to AI agent");
        setStatus(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const getActionColor = (action: string) => {
    switch (action) {
      case "buy":
        return "text-blue-400";
      case "sell":
      case "reprice":
        return "text-secondary";
      case "restock":
        return "text-green-400";
      case "withdraw":
        return "text-primary";
      case "seed":
        return "text-purple-400";
      default:
        return "text-gray-400";
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "buy":
        return "🛒";
      case "reprice":
        return "💰";
      case "restock":
        return "📦";
      case "withdraw":
        return "💸";
      case "seed":
        return "🌱";
      default:
        return "⚡";
    }
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    
    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
    return `${Math.floor(diffSecs / 3600)}h ago`;
  };

  if (isLoading) {
    return (
      <div className="glass-card p-6 border border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="w-6 h-6 text-primary animate-pulse" />
          <h2 className="text-xl font-bold text-white">AI Agent Brain</h2>
        </div>
        <p className="text-gray-400">Connecting to AI agent...</p>
      </div>
    );
  }

  if (error || !status) {
    return (
      <div className="glass-card p-6 border border-red-500/30 bg-red-500/5">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="w-6 h-6 text-red-400" />
          <h2 className="text-xl font-bold text-white">AI Agent Brain</h2>
          <span className="ml-auto px-3 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
            Offline
          </span>
        </div>
        <p className="text-red-400 text-sm mb-2">{error}</p>
        <p className="text-gray-400 text-sm">
          Start the AI agent: <code className="text-primary">python ai_agent/agent.py</code>
        </p>
        <p className="text-gray-400 text-sm mt-1">
          Start the API server: <code className="text-primary">python ai_agent/api_server.py</code>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status Header */}
      <div className="glass-card p-6 border border-primary/30 bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Brain className="w-8 h-8 text-primary" />
              {status.is_running && (
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-500"
                />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">AI Agent Brain</h2>
              <p className="text-sm text-gray-400">Autonomous merchant intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {status.is_running ? (
              <span className="px-4 py-2 rounded-full text-sm font-semibold bg-green-500/20 text-green-400 border border-green-500/30 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Active
              </span>
            ) : (
              <span className="px-4 py-2 rounded-full text-sm font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
                Inactive
              </span>
            )}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
            <Wallet className="w-5 h-5 text-primary" />
            <div>
              <p className="text-xs text-gray-400">Wallet Balance</p>
              <p className="text-lg font-bold text-white">{status.wallet_balance_eth.toFixed(4)} ETH</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
            <Zap className="w-5 h-5 text-secondary" />
            <div>
              <p className="text-xs text-gray-400">Total Decisions</p>
              <p className="text-lg font-bold text-white">{status.total_decisions_made}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
            <Activity className="w-5 h-5 text-green-400" />
            <div>
              <p className="text-xs text-gray-400">Merchants</p>
              <p className="text-lg font-bold text-white">{status.merchants_monitored}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
            <Clock className="w-5 h-5 text-accent" />
            <div>
              <p className="text-xs text-gray-400">Uptime</p>
              <p className="text-lg font-bold text-white">{formatUptime(status.uptime_seconds)}</p>
            </div>
          </div>
        </div>

        {/* Agent Address */}
        <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10">
          <p className="text-xs text-gray-400 mb-1">Agent Address</p>
          <code className="text-sm text-primary font-mono">{status.agent_address}</code>
        </div>
      </div>

      {/* Recent Decisions */}
      <div className="glass-card p-6 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold text-white">AI Decision Stream</h3>
          </div>
          <span className="text-sm text-gray-400">Live updates</span>
        </div>

        {status.recent_decisions.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No decisions made yet. Agent is monitoring...</p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {status.recent_decisions.slice(0, 10).map((decision, idx) => (
                <motion.div
                  key={`${decision.timestamp}-${idx}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getActionIcon(decision.action)}</span>
                      <div>
                        <span className={`font-bold ${getActionColor(decision.action)} uppercase text-sm`}>
                          {decision.action}
                        </span>
                        <span className="text-gray-400 text-sm ml-2">
                          Merchant #{decision.merchant_id}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">{formatTimestamp(decision.timestamp)}</span>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed mb-2">{decision.reasoning}</p>
                  {Object.keys(decision.details).length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {Object.entries(decision.details).map(([key, value]) => (
                        <span
                          key={key}
                          className="px-2 py-1 rounded text-xs bg-white/5 text-gray-400 border border-white/10"
                        >
                          {key}: <span className="text-white font-semibold">{String(value)}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
