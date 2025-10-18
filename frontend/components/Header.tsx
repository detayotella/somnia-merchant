"use client";

import Image from "next/image";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export function Header() {
  return (
    <header className="relative overflow-hidden rounded-2xl border border-borderLight bg-surface/90 backdrop-blur-2xl shadow-luxury">
      <div className="absolute inset-0 bg-gradient-subtle pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      <div className="relative flex items-center justify-between px-8 py-5 flex-wrap gap-4">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="relative flex h-14 w-14 items-center justify-center">
              <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
                <defs>
                  <linearGradient id="hexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#D4AF37" />
                    <stop offset="50%" stopColor="#FFD700" />
                    <stop offset="100%" stopColor="#D4AF37" />
                  </linearGradient>
                </defs>
                <path
                  d="M50 5 L90 27.5 L90 72.5 L50 95 L10 72.5 L10 27.5 Z"
                  fill="url(#hexGradient)"
                  opacity="0.18"
                  stroke="url(#hexGradient)"
                  strokeWidth="1.2"
                />
              </svg>
              <span className="relative text-2xl font-bold text-primary">Ⓢ</span>
            </div>
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-textPrimary tracking-tight">
              Somnia
              <span className="ml-2 text-primary">Merchant</span>
            </h1>
            <p className="text-sm text-textMuted font-medium">Autonomous Trading Network</p>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <ConnectButton.Custom>
            {({
              account,
              chain,
              openAccountModal,
              openChainModal,
              openConnectModal,
              authenticationStatus,
              mounted,
            }) => {
              const ready = mounted && authenticationStatus !== "loading";
              const connected =
                ready &&
                account &&
                chain &&
                (!authenticationStatus || authenticationStatus === "authenticated");

              return (
                <div
                  {...(!ready && {
                    "aria-hidden": true,
                    style: {
                      opacity: 0,
                      pointerEvents: "none",
                      userSelect: "none",
                    },
                  })}
                >
                  {(() => {
                    if (!connected) {
                      return (
                        <button
                          onClick={openConnectModal}
                          type="button"
                          className="group relative flex items-center gap-2 rounded-xl px-6 py-3 font-semibold text-background shadow-glow transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]"
                          style={{
                            background: "linear-gradient(135deg, #D4AF37 0%, #FFD700 50%, #D4AF37 100%)",
                            backgroundSize: "180% 100%",
                          }}
                        >
                          <span className="relative z-10 flex items-center gap-2">
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 1v22M5 8h14M5 16h14"
                              />
                            </svg>
                            Connect Wallet
                          </span>
                          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                        </button>
                      );
                    }

                    if (chain.unsupported) {
                      return (
                        <button
                          onClick={openChainModal}
                          type="button"
                          className="rounded-xl bg-error px-6 py-3 text-sm font-semibold text-white shadow-glow hover:bg-error/90"
                        >
                          Wrong network
                        </button>
                      );
                    }

                    return (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={openChainModal}
                          className="flex items-center gap-2 rounded-xl border border-borderLight bg-surfaceLight px-4 py-2.5 text-xs font-medium text-textSecondary transition-colors hover:border-primary/40"
                          type="button"
                        >
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/70" />
                            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
                          </span>
                          {chain.hasIcon && chain.iconUrl && (
                            <span className="relative h-4 w-4 overflow-hidden rounded-full">
                              <Image
                                alt={chain.name ?? "Chain icon"}
                                src={chain.iconUrl}
                                fill
                                sizes="16px"
                                className="object-cover"
                              />
                            </span>
                          )}
                          {chain.name}
                        </button>

                        <button
                          onClick={openAccountModal}
                          type="button"
                          className="group relative flex items-center gap-3 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent px-5 py-2.5 text-sm font-semibold text-primary transition-shadow hover:shadow-glow"
                        >
                          <span className="flex flex-col items-start leading-tight">
                            <span className="font-mono text-xs uppercase tracking-wider text-textSecondary">
                              Connected
                            </span>
                            <span className="font-semibold text-textPrimary">
                              {account.displayName}
                            </span>
                          </span>
                          {account.displayBalance && (
                            <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary">
                              {account.displayBalance}
                            </span>
                          )}
                          <span className="text-textSecondary transition-transform group-hover:translate-y-0.5">
                            ▼
                          </span>
                        </button>
                      </div>
                    );
                  })()}
                </div>
              );
            }}
          </ConnectButton.Custom>
        </div>
      </div>
    </header>
  );
}
