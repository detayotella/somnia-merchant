"use client";

interface ActivityEntry {
  id: string;
  message: string;
  timestamp: number;
}

interface ActivityFeedProps {
  entries: ActivityEntry[];
}

export function ActivityFeed({ entries }: ActivityFeedProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-borderLight bg-gradient-to-br from-surface/80 to-surfaceLight/60 backdrop-blur-xl p-6 shadow-card">
      <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-secondary/50 to-transparent" />
      
      <header className="relative mb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-8 w-1 rounded-full bg-gradient-to-b from-secondary to-accent" />
          <h3 className="font-display text-xl font-bold text-textPrimary">Activity Stream</h3>
        </div>
        <p className="text-sm text-textMuted">Real-time trading events and updates</p>
      </header>
      
      <div className="relative max-h-96 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-xl border border-dashed border-borderLight bg-background/30">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-secondary/20 to-accent/20">
              <svg className="h-6 w-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="text-sm text-textMuted mb-1">No activity yet</p>
            <p className="text-xs text-textDisabled">Events will appear here when trades occur</p>
          </div>
        ) : (
          entries.map((entry, index) => (
            <div 
              key={entry.id} 
              className="group relative flex items-start gap-4 rounded-xl border border-borderLight bg-surfaceLight/50 p-4 hover:border-secondary/30 hover:bg-surfaceLight transition-all duration-200"
            >
              <div className="flex-shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-secondary/20 to-accent/20">
                  <div className="h-2 w-2 rounded-full bg-secondary" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-textPrimary group-hover:text-secondary transition-colors">
                  {entry.message}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <svg className="h-3 w-3 text-textDisabled" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs text-textMuted font-mono">
                    {new Date(entry.timestamp * 1000).toLocaleTimeString([], { 
                      hour: "2-digit", 
                      minute: "2-digit",
                      second: "2-digit"
                    })}
                  </span>
                </div>
              </div>
              {index === 0 && (
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20">
                    New
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
