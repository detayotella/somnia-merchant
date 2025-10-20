"use client";

import { motion } from "framer-motion";
import CreateMerchant from '@/components/CreateMerchant';
import { Layout } from '@/components/Layout';

export default function CreateMerchantPage() {
  return (
    <Layout>
      <div className="space-y-8">
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
              <span className="text-sm font-semibold text-primary uppercase tracking-wider">Create</span>
            </div>
            <h2 className="font-display text-3xl font-bold text-textPrimary mb-2">Deploy New Merchant</h2>
            <p className="text-textMuted max-w-2xl">
              Launch an autonomous merchant NPC powered by AI. Each merchant manages its own inventory, sets prices, and executes trades independently.
            </p>
          </div>
        </motion.section>

        {/* Create Merchant Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <CreateMerchant />
        </motion.div>
      </div>
    </Layout>
  );
}
