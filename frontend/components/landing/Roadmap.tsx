"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Circle, Clock } from "lucide-react";

interface RoadmapPhase {
  title: string;
  description: string;
  status: "completed" | "in-progress" | "planned";
  items: string[];
}

export function Roadmap() {
  const phases: RoadmapPhase[] = [
    {
      title: "Phase 1: Foundation",
      description: "Smart contract architecture and merchant NFT system",
      status: "completed",
      items: [
        "ERC-721 merchant contract with inventory system",
        "On-chain profit tracking and ownership",
        "Buy/sell transaction mechanisms",
        "Somnia testnet deployment",
      ],
    },
    {
      title: "Phase 2: AI Integration",
      description: "Autonomous agent development and blockchain connectivity",
      status: "in-progress",
      items: [
        "Python AI agent with blockchain reading capabilities",
        "Autonomous decision-making engine",
        "Market analysis and trading logic",
        "Continuous monitoring loop",
      ],
    },
    {
      title: "Phase 3: Cinematic UI",
      description: "Next.js console with real-time merchant monitoring",
      status: "in-progress",
      items: [
        "RainbowKit wallet integration",
        "Real-time contract event watching",
        "Merchant dashboard with profit analytics",
        "Activity feed and transaction history",
      ],
    },
    {
      title: "Phase 4: Autonomy",
      description: "Full autonomous trading and merchant behavior",
      status: "planned",
      items: [
        "AI agent executing trades without human input",
        "Dynamic pricing based on market conditions",
        "Multi-merchant ecosystem interactions",
        "Advanced profit optimization strategies",
      ],
    },
    {
      title: "Phase 5: Scaling",
      description: "Ecosystem expansion and advanced features",
      status: "planned",
      items: [
        "Multiple merchant types and specializations",
        "Inter-merchant trading and negotiations",
        "Reputation and trust systems",
        "Community-driven merchant creation",
      ],
    },
  ];

  const getStatusIcon = (status: RoadmapPhase["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-6 h-6 text-green-500" />;
      case "in-progress":
        return <Clock className="w-6 h-6 text-secondary animate-pulse" />;
      case "planned":
        return <Circle className="w-6 h-6 text-gray-600" />;
    }
  };

  const getStatusColor = (status: RoadmapPhase["status"]) => {
    switch (status) {
      case "completed":
        return "from-green-500/20 to-green-600/20 border-green-500/30";
      case "in-progress":
        return "from-secondary/20 to-accent/20 border-secondary/30";
      case "planned":
        return "from-gray-700/20 to-gray-800/20 border-gray-700/30";
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-gradient-to-b from-primary via-secondary to-gray-700" />

        {/* Phases */}
        <div className="space-y-8">
          {phases.map((phase, idx) => (
            <motion.div
              key={phase.title}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              viewport={{ once: true }}
              className="relative pl-20"
            >
              {/* Timeline node */}
              <div className="absolute left-5 top-6 z-10">{getStatusIcon(phase.status)}</div>

              {/* Phase card */}
              <div
                className={`
                glass-card p-6 
                bg-gradient-to-br ${getStatusColor(phase.status)}
                border
                hover:border-white/30 transition-all duration-300
                group
              `}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">{phase.title}</h3>
                    <p className="text-sm text-gray-400">{phase.description}</p>
                  </div>
                  <span
                    className={`
                    px-3 py-1 rounded-full text-xs font-semibold
                    ${
                      phase.status === "completed"
                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                        : phase.status === "in-progress"
                          ? "bg-secondary/20 text-secondary border border-secondary/30"
                          : "bg-gray-700/20 text-gray-400 border border-gray-700/30"
                    }
                  `}
                  >
                    {phase.status === "completed"
                      ? "Completed"
                      : phase.status === "in-progress"
                        ? "In Progress"
                        : "Planned"}
                  </span>
                </div>

                {/* Items */}
                <ul className="space-y-2 mt-4">
                  {phase.items.map((item, itemIdx) => (
                    <motion.li
                      key={itemIdx}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 + itemIdx * 0.05 }}
                      viewport={{ once: true }}
                      className="flex items-start gap-3 text-sm text-gray-300"
                    >
                      <div
                        className={`
                        w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0
                        ${
                          phase.status === "completed"
                            ? "bg-green-500"
                            : phase.status === "in-progress"
                              ? "bg-secondary"
                              : "bg-gray-600"
                        }
                      `}
                      />
                      <span className="leading-relaxed">{item}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Vision statement */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        viewport={{ once: true }}
        className="mt-16 p-8 glass-card border border-primary/30 bg-gradient-to-br from-primary/10 to-secondary/10"
      >
        <h3 className="text-2xl font-bold text-primary mb-4 flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
          The Vision
        </h3>
        <p className="text-gray-300 leading-relaxed text-lg">
          Somnia Merchant NPC represents the future of blockchain applications—where smart contracts
          become <span className="text-primary font-semibold">living economic actors</span>. By
          combining on-chain autonomy with AI decision-making, we&apos;re creating a new paradigm:{" "}
          <span className="text-secondary font-semibold">autonomous commerce</span> that operates
          transparently, continuously, and independently. This is not just a demo—it&apos;s a proof of
          concept for the next generation of decentralized applications.
        </p>
      </motion.div>
    </div>
  );
}
