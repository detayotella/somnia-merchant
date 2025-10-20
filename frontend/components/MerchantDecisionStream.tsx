'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Zap, Clock } from 'lucide-react';

interface AgentDecision {
  timestamp: string;
  action: string;
  merchant_id: number | string;
  merchant_address?: string;
  details: Record<string, any>;
  reasoning: string;
}

interface MerchantOption {
  address: string;
  merchant_id?: number;
  last_activity: string;
  decision_count: number;
}

const API_URL = 'http://localhost:8000';

export function MerchantDecisionStream() {
  const [decisions, setDecisions] = useState<AgentDecision[]>([]);
  const [merchants, setMerchants] = useState<MerchantOption[]>([]);
  const [selectedMerchant, setSelectedMerchant] = useState<string>('all');
  const [isStreaming, setIsStreaming] = useState(false);

  // Fetch available merchants
  useEffect(() => {
    const fetchMerchants = async () => {
      try {
        const response = await fetch(`${API_URL}/api/merchants`);
        const data = await response.json();
        setMerchants(data.merchants || []);
      } catch (err) {
        console.error('Failed to fetch merchants:', err);
      }
    };

    fetchMerchants();
    const interval = setInterval(fetchMerchants, 10000); // Update every 10s
    return () => clearInterval(interval);
  }, []);

  // Fetch decisions with merchant filter
  useEffect(() => {
    const fetchDecisions = async () => {
      try {
        const url = selectedMerchant === 'all'
          ? `${API_URL}/api/agent/decisions?limit=20`
          : `${API_URL}/api/agent/decisions?limit=20&merchant_address=${selectedMerchant}`;
        
        const response = await fetch(url);
        const data = await response.json();
        setDecisions(data.decisions || []);
      } catch (err) {
        console.error('Failed to fetch decisions:', err);
      }
    };

    fetchDecisions();
    const interval = setInterval(fetchDecisions, 3000); // Poll every 3s
    return () => clearInterval(interval);
  }, [selectedMerchant]);

  // SSE streaming (optional enhancement)
  useEffect(() => {
    if (!isStreaming) return;

    const url = selectedMerchant === 'all'
      ? `${API_URL}/api/agent/decisions/stream`
      : `${API_URL}/api/agent/decisions/stream?merchant_address=${selectedMerchant}`;

    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      try {
        const decision = JSON.parse(event.data);
        setDecisions((prev) => [decision, ...prev].slice(0, 20));
      } catch (err) {
        console.error('Failed to parse SSE decision:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE connection error:', err);
      eventSource.close();
      setIsStreaming(false);
    };

    return () => {
      eventSource.close();
    };
  }, [isStreaming, selectedMerchant]);

  const getActionColor = (action: string) => {
    switch (action) {
      case 'buy':
        return 'text-blue-400';
      case 'sell':
      case 'reprice':
        return 'text-yellow-400';
      case 'restock':
        return 'text-green-400';
      case 'withdraw':
        return 'text-purple-400';
      default:
        return 'text-gray-400';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'buy':
        return '🛒';
      case 'reprice':
        return '💰';
      case 'restock':
        return '📦';
      case 'withdraw':
        return '💸';
      default:
        return '⚡';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const formatMerchantAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="space-y-4">
      {/* Merchant Filter */}
      <div className="flex items-center justify-between gap-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-blue-400" />
          <span className="text-white font-semibold">AI Decisions</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Merchant selector */}
          <select
            value={selectedMerchant}
            onChange={(e) => setSelectedMerchant(e.target.value)}
            className="px-3 py-1.5 bg-gray-700 text-white rounded border border-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Merchants</option>
            {merchants.map((merchant) => (
              <option key={merchant.address} value={merchant.address}>
                {merchant.merchant_id 
                  ? `Merchant #${merchant.merchant_id}`
                  : formatMerchantAddress(merchant.address)
                } ({merchant.decision_count})
              </option>
            ))}
          </select>

          {/* Stream toggle */}
          <button
            onClick={() => setIsStreaming(!isStreaming)}
            className={`px-3 py-1.5 rounded text-sm transition ${
              isStreaming
                ? 'bg-green-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {isStreaming ? '🔴 Live' : '▶ Start Stream'}
          </button>
        </div>
      </div>

      {/* Decision List */}
      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {decisions.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No decisions yet. Agent is monitoring...</p>
          </div>
        ) : (
          <AnimatePresence>
            {decisions.map((decision, idx) => (
              <motion.div
                key={`${decision.timestamp}-${idx}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="p-4 bg-gray-800 rounded-lg border border-gray-700 hover:border-blue-500 transition"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getActionIcon(decision.action)}</span>
                    <span className={`font-semibold ${getActionColor(decision.action)}`}>
                      {decision.action.toUpperCase()}
                    </span>
                    {decision.merchant_address && (
                      <span className="text-xs text-gray-400 font-mono">
                        {formatMerchantAddress(decision.merchant_address)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {formatTimestamp(decision.timestamp)}
                  </div>
                </div>

                {/* Details */}
                {Object.keys(decision.details).length > 0 && (
                  <div className="mb-2 text-sm text-gray-300">
                    {Object.entries(decision.details).map(([key, value]) => (
                      <div key={key} className="flex gap-2">
                        <span className="text-gray-500">{key}:</span>
                        <span className="text-white font-mono">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reasoning */}
                <div className="mt-2 p-3 bg-gray-900 rounded border border-gray-700">
                  <div className="flex items-start gap-2">
                    <Zap className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-300 leading-relaxed">
                      {decision.reasoning}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
