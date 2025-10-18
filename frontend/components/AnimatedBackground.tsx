"use client";

import { motion } from "framer-motion";

export function AnimatedBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      {/* Base Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f0b06] via-[#1b1712]/60 to-[#0f0b06]" />

      {/* Large Gold/Bronze Orbs */}
      <div className="absolute -left-40 -top-24 w-[420px] h-[420px] rounded-full bg-gradient-to-tr from-[#8b5e34] via-[#D4AF37] to-[#b07a2b] opacity-18 blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute -right-36 top-12 w-[360px] h-[360px] rounded-full bg-gradient-to-br from-[#a97a39] via-[#D4AF37] to-[#8b5e34] opacity-14 blur-2xl animate-blob animation-delay-4000" />
      <div className="absolute left-1/2 bottom-[-90px] w-[280px] h-[280px] rounded-full bg-gradient-to-r from-[#D4AF37] to-[#b07a2b] opacity-12 blur-xl animate-blob" />

      {/* Subtle Grid Pattern in warm tone */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(212, 175, 55, 0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(212, 175, 55, 0.18) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Floating particles */}
      <div className="absolute inset-0">
        {Array.from({ length: 24 }).map((_, i) => {
          const left = `${(i * 13) % 100}%`;
          const top = `${(i * 19) % 100}%`;
          const color = i % 3 === 0 ? 'rgba(212,175,55,0.18)' : i % 3 === 1 ? 'rgba(176,122,43,0.12)' : 'rgba(208,170,60,0.12)';

          return (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{ left, top, width: 4, height: 4, background: color }}
              animate={{ y: [-8, -28, -8], opacity: [0, 0.6, 0], scale: [0.6, 1, 0.6] }}
              transition={{ duration: 6 + (i % 4), repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
            />
          );
        })}
      </div>

      {/* Top/Bottom vignette */}
      <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-[#0f0b06] to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#0f0b06] to-transparent" />
    </div>
  );
}
