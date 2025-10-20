"use client";

import { ReactNode } from "react";
import { AnimatedBackground } from "./AnimatedBackground";
import { Header } from "./Header";
import { Navigation } from "./Navigation";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="relative flex min-h-screen flex-col bg-background overflow-hidden">
      <AnimatedBackground />
      
      {/* Main Content */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-4 pb-6 space-y-4">
        <Header />
        <Navigation />
        <main className="pt-2">{children}</main>
      </div>

      {/* Footer */}
      <footer className="relative z-10 mt-auto py-8 border-t border-borderLight">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-textMuted">
              Built on <span className="text-primary font-semibold">Somnia</span> • Powered by AI
            </p>
            <div className="flex items-center gap-6">
              <a href="https://docs.somnia.network" target="_blank" rel="noopener noreferrer" className="text-sm text-textMuted hover:text-primary transition-colors">
                Docs
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-sm text-textMuted hover:text-primary transition-colors">
                GitHub
              </a>
              <a href="#" className="text-sm text-textMuted hover:text-primary transition-colors">
                Support
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
