"use client";

import { motion } from "framer-motion";
import { Database, Brain, MonitorPlay, ArrowRight } from "lucide-react";

interface ArchitectureDiagramProps {
  detailed?: boolean;
}

export function ArchitectureDiagram({ detailed = false }: ArchitectureDiagramProps) {
  const layers = [
    {
      icon: Database,
      title: "Smart Contracts",
      subtitle: "ERC-721 NFT Merchants",
      description: detailed
        ? "On-chain merchant entities with inventory, profit tracking, and autonomous transaction capabilities. Each merchant is a living smart contract that owns assets and generates revenue."
        : "On-chain merchant entities with autonomous capabilities",
      color: "from-primary/20 to-secondary/20",
      iconColor: "text-primary",
    },
    {
      icon: Brain,
      title: "AI Agent Layer",
      subtitle: "Autonomous Decision Engine",
      description: detailed
        ? "Python-based AI loop that reads blockchain state, analyzes market conditions, and executes trades. The agent makes independent economic decisions without human intervention."
        : "AI loop analyzing blockchain state and executing trades",
      color: "from-secondary/20 to-accent/20",
      iconColor: "text-secondary",
    },
    {
      icon: MonitorPlay,
      title: "Frontend Console",
      subtitle: "Cinematic Interface",
      description: detailed
        ? "Next.js dashboard providing real-time visibility into merchant behavior, profit streams, and autonomous trading activity. A sci-fi merchant command center experience."
        : "Real-time monitoring and merchant command center",
      color: "from-accent/20 to-primary/20",
      iconColor: "text-accent",
    },
  ];

  return (
    <div className="relative w-full max-w-5xl mx-auto">
      {/* Flow visualization */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-4">
        {layers.map((layer, idx) => (
          <div key={layer.title} className="flex items-center gap-4 lg:gap-8 w-full lg:w-auto">
            {/* Layer Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.2 }}
              viewport={{ once: true }}
              className={`
                glass-card p-6 flex-1 lg:w-64
                bg-gradient-to-br ${layer.color}
                border border-white/10
                hover:border-white/20 transition-all duration-300
                group
              `}
            >
              {/* Icon */}
              <div
                className={`
                w-12 h-12 rounded-lg 
                bg-gradient-to-br from-white/5 to-white/10 
                flex items-center justify-center mb-4
                group-hover:scale-110 transition-transform duration-300
              `}
              >
                <layer.icon className={`w-6 h-6 ${layer.iconColor}`} />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-white mb-1">{layer.title}</h3>
              <p className="text-sm text-secondary/90 mb-3 font-medium">{layer.subtitle}</p>
              <p className="text-sm text-gray-400 leading-relaxed">{layer.description}</p>
            </motion.div>

            {/* Arrow connector (not on last item) */}
            {idx < layers.length - 1 && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.2 + 0.1 }}
                viewport={{ once: true }}
                className="hidden lg:block"
              >
                <ArrowRight className="w-8 h-8 text-primary/40" />
              </motion.div>
            )}

            {/* Mobile arrow (vertical) */}
            {idx < layers.length - 1 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.2 + 0.1 }}
                viewport={{ once: true }}
                className="lg:hidden rotate-90"
              >
                <ArrowRight className="w-8 h-8 text-primary/40" />
              </motion.div>
            )}
          </div>
        ))}
      </div>

      {/* Data flow visualization */}
      {detailed && (
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          viewport={{ once: true }}
          className="mt-12 p-6 glass-card border border-primary/20"
        >
          <h4 className="text-lg font-bold text-primary mb-3 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Data Flow
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-400">
            <div>
              <span className="text-white font-semibold">Contract → AI:</span> Inventory state, profit
              balances, transaction history
            </div>
            <div>
              <span className="text-white font-semibold">AI → Contract:</span> Buy/sell orders, price
              adjustments, autonomy commands
            </div>
            <div>
              <span className="text-white font-semibold">Contract → Frontend:</span> Real-time events,
              merchant analytics, activity logs
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
