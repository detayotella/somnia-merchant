"use client";

import { useMemo, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Store, Package, TrendingUp } from "lucide-react";
import { useMerchantStore } from "../../store/useMerchantStore";
import { ProfitPanel } from "../../components/ProfitPanel";
import { ActivityFeed } from "../../components/ActivityFeed";
import MerchantList from "../../components/MerchantList";
import { Layout } from "../../components/Layout";
import { DeploymentNotice } from "../../components/DeploymentNotice";

interface DashboardStats {
  merchantCount: number;
  totalItems: number;
  totalProfit: number;
  merchantStats: Array<{
    address: string;
    itemCount: number;
    profit: number;
  }>;
}

export default function DashboardPage() {
  const { activities } = useMerchantStore();
  const [stats, setStats] = useState<DashboardStats>({
    merchantCount: 0,
    totalItems: 0,
    totalProfit: 0,
    merchantStats: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch aggregated dashboard stats from API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/dashboard/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const totals = useMemo(() => ({
    totalProfit: stats.totalProfit,
    totalItems: stats.totalItems,
    merchantCount: stats.merchantCount,
  }), [stats]);

  const chartData = useMemo(() => {
    return stats.merchantStats.map((merchant, index) => ({
      label: `#${index + 1}`,
      value: merchant.profit,
    }));
  }, [stats]);

  return (
    <Layout>
      <div className="space-y-8">
        {/* Deployment Notice */}
        <DeploymentNotice />

        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border border-borderLight bg-gradient-to-br from-surface/80 to-surfaceLight/60 backdrop-blur-xl p-8 shadow-card"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-secondary/10 pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-1 w-16 rounded-full bg-gradient-to-r from-primary to-secondary" />
              <span className="text-sm font-semibold text-primary uppercase tracking-wider">Dashboard</span>
            </div>
            <h2 className="font-display text-3xl font-bold text-textPrimary mb-2">Merchant Fleet Overview</h2>
            <p className="text-textMuted max-w-2xl">
              Monitor your autonomous merchant NPCs, track earnings, and view real-time inventory across your entire fleet.
            </p>
          </div>
        </motion.section>

        {/* Stats Cards */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid gap-6 md:grid-cols-3"
        >
          <StatCard
            icon={<Store className="h-6 w-6" />}
            title="Merchants"
            value={totals.merchantCount}
            subtitle="On-chain NPCs managed by AI"
            color="mint"
          />
          <StatCard
            icon={<Package className="h-6 w-6" />}
            title="Inventory Items"
            value={totals.totalItems}
            subtitle="Across the active merchant fleet"
            color="purple"
          />
          <StatCard
            icon={<TrendingUp className="h-6 w-6" />}
            title="Total Profit"
            value={`${totals.totalProfit.toFixed(4)} ETH`}
            subtitle="Lifetime earnings"
            color="gold"
          />
        </motion.section>

        {/* Merchant List Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <MerchantList />
        </motion.section>

        {/* Analytics Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid gap-6 lg:grid-cols-2"
        >
          <ProfitPanel data={chartData} />
          <ActivityFeed entries={activities} />
        </motion.div>
      </div>
    </Layout>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  value: string | number;
  color: "mint" | "purple" | "gold";
}

function StatCard({ icon, title, subtitle, value, color }: StatCardProps) {
  const colorClasses = {
    mint: "from-mint/10 to-mint/5 text-mint border-mint/20",
    purple: "from-purple-500/10 to-purple-500/5 text-purple-400 border-purple-500/20",
    gold: "from-gold/10 to-gold/5 text-gold border-gold/20"
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br backdrop-blur-xl p-6 shadow-xl ${colorClasses[color]}`}
    >
      <div className="absolute right-0 top-0 h-32 w-32 bg-gradient-to-br from-white/5 to-transparent blur-2xl" />
      <div className="relative flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <p className="text-xs text-textMuted uppercase tracking-wider">{title}</p>
          <h3 className="font-display text-4xl font-bold">{value}</h3>
          <p className="text-sm text-textMuted">{subtitle}</p>
        </div>
        <div className={`rounded-xl p-3 bg-gradient-to-br ${colorClasses[color].split(' ')[0]} ${colorClasses[color].split(' ')[1]}`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
}
