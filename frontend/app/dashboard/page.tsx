"use client";

import { useMemo } from "react";
import { useMerchantStore } from "../../store/useMerchantStore";
import { ProfitPanel } from "../../components/ProfitPanel";
import { ActivityFeed } from "../../components/ActivityFeed";
import { formatEther } from "viem";

export default function DashboardPage() {
  const { merchants, activities } = useMerchantStore();

  const totals = useMemo(() => {
    const totalProfit = merchants.reduce((acc, merchant) => acc + Number(formatEther(merchant.profitWei)), 0);
    const totalItems = merchants.reduce((acc, merchant) => acc + merchant.items.length, 0);
    return {
      totalProfit,
      totalItems,
      merchantCount: merchants.length
    };
  }, [merchants]);

  const chartData = useMemo(
    () =>
      merchants.map((merchant) => ({
        label: `#${merchant.tokenId}`,
        value: Number(formatEther(merchant.profitWei))
      })),
    [merchants]
  );

  return (
    <div className="grid gap-8">
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard title="Merchants" value={totals.merchantCount} subtitle="On-chain NPCs managed by the AI" />
        <StatCard title="Inventory Items" value={totals.totalItems} subtitle="Across the active merchant fleet" />
        <StatCard title="Total Profit" value={`${totals.totalProfit.toFixed(2)} Ξ`} subtitle="Lifetime earnings" />
      </section>
      <div className="grid gap-6 lg:grid-cols-2">
        <ProfitPanel data={chartData} />
        <ActivityFeed entries={activities} />
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  subtitle: string;
  value: string | number;
}

function StatCard({ title, subtitle, value }: StatCardProps) {
  return (
    <div className="rounded-2xl bg-surface/70 p-6 shadow-glow">
      <p className="text-sm text-textMuted">{subtitle}</p>
      <h3 className="mt-2 font-display text-3xl text-textPrimary">{value}</h3>
      <p className="text-xs text-textMuted uppercase tracking-[0.2em]">{title}</p>
    </div>
  );
}
