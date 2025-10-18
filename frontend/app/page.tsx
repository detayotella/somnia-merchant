"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "../components/ui/Button";
import { Roadmap } from "../components/landing/Roadmap";
import { ArchitectureDiagram } from "../components/landing/ArchitectureDiagram";
import { HeroBackground } from "../components/landing/HeroBackground";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-textPrimary">
      <HeroBackground />
      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-24 px-6 py-20">
        <section className="grid gap-12 items-center lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-8">
            <motion.span
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-surface/80 px-4 py-2 text-xs uppercase tracking-[0.3em] text-primary"
            >
              Somnia AI Hackathon
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.7 }}
              className="font-display text-5xl font-bold leading-tight md:text-6xl"
            >
              Living Smart Contracts — Autonomous Merchant NPCs on Somnia
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7 }}
              className="max-w-2xl text-lg text-textMuted"
            >
              Somnia Merchant NPC proves how AI agents can own on-chain stores, trade,
              and reveal their reasoning in real time. Explore a cinematic console
              where every merchant is an economic actor, not just a static NFT.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.7 }}
              className="flex flex-wrap items-center gap-4"
            >
              <Link href="/console">
                <Button variant="primary" size="lg">
                  Launch Merchant Console
                </Button>
              </Link>
              <Link href="#architecture" className="text-sm font-semibold text-primary hover:text-primaryLight">
                Explore Architecture →
              </Link>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="relative overflow-hidden rounded-3xl border border-borderLight bg-surface/70 p-8 shadow-card backdrop-blur-xl"
          >
            <ArchitectureDiagram />
          </motion.div>
        </section>

        <section className="grid gap-10 md:grid-cols-3" id="pillars">
          {pillars.map((pillar, index) => (
            <motion.div
              key={pillar.title}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: 0.1 * index, duration: 0.6 }}
              className="glass-card space-y-4 p-6"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
                {pillar.icon}
              </div>
              <h3 className="font-display text-xl text-textPrimary">{pillar.title}</h3>
              <p className="text-sm text-textMuted">{pillar.description}</p>
            </motion.div>
          ))}
        </section>

        <section id="architecture" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-surface/70 px-3 py-1 text-xs uppercase tracking-[0.3em] text-primary">
              Architecture
            </div>
            <h2 className="font-display text-3xl font-semibold text-textPrimary">
              How AI, Smart Contracts, and Motion UI Interlock
            </h2>
            <p className="max-w-3xl text-textMuted">
              Three synchronized layers drive Somnia Merchant NPC: an ERC-721 merchant core, a Python intelligence
              loop, and a Next.js cinematic interface. Each merchant is a living contract with autonomy, memory, and
              storytelling.
            </p>
          </motion.div>
          <ArchitectureDiagram detailed />
        </section>

        <Roadmap />
      </div>
    </main>
  );
}

const pillars = [
  {
    title: "Autonomous Commerce",
    description:
      "Each merchant NFT owns its inventory, calculates margins, and executes trades with zero manual input.",
    icon: <span className="text-2xl">⚡</span>
  },
  {
    title: "Transparent Intelligence",
    description:
      "Every decision flows on-chain and into the console, revealing why the AI agent bought, sold, or waited.",
    icon: <span className="text-2xl">👁️</span>
  },
  {
    title: "Cinematic Interface",
    description:
      "A Somnia-grade dashboard with motion, depth, and narrative that invites users into the autonomous bazaar.",
    icon: <span className="text-2xl">🎬</span>
  }
];