import { Shield } from 'lucide-react';
import clsx from 'clsx';
import { useMilitaryBasesStore } from '../../militaryBases.store';
import { useMilitaryBaseStats } from '../../hooks/useMilitaryBases';

const CATS = [
  {
    key: 'air' as const,
    label: 'Air Base',
    color: 'text-sky-400',
    dot: 'bg-sky-400',
    bar: 'bg-sky-400',
  },
  {
    key: 'naval' as const,
    label: 'Naval',
    color: 'text-cyan-400',
    dot: 'bg-cyan-400',
    bar: 'bg-cyan-400',
  },
  {
    key: 'ground' as const,
    label: 'Ground',
    color: 'text-green-400',
    dot: 'bg-green-400',
    bar: 'bg-green-400',
  },
  {
    key: 'hq' as const,
    label: 'HQ / Cmd',
    color: 'text-amber-400',
    dot: 'bg-amber-400',
    bar: 'bg-amber-400',
  },
];

export function MilitaryBasesWidget() {
  const { enabled, setEnabled } = useMilitaryBasesStore();
  const { data: stats, isLoading } = useMilitaryBaseStats();

  return (
    <div className="flex flex-col h-full gap-0">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 pb-2 border-b border-white/10">
        <div className="flex items-center gap-1.5">
          <Shield
            size={12}
            className={clsx(
              'transition-all',
              enabled
                ? 'text-green-400 drop-shadow-[0_0_6px_rgba(74,222,128,0.9)]'
                : 'text-green-400/35',
            )}
          />
          <span className="text-[10px] font-bold uppercase tracking-widest text-intel-text-light">
            Mil Bases
          </span>
        </div>
        <button
          onClick={() => setEnabled(!enabled)}
          className={clsx(
            'text-[8px] px-2 py-0.5 font-bold border transition-all',
            enabled
              ? 'bg-green-500/20 text-green-300 border-green-500/50 shadow-[0_0_6px_rgba(74,222,128,0.15)]'
              : 'bg-black/60 text-white/30 border-white/12 hover:border-green-500/40 hover:text-green-400/60',
          )}
        >
          {enabled ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pt-2 space-y-2.5">
        {isLoading && (
          <span className="text-[8px] text-white/20 animate-pulse font-mono">&gt; Indexing...</span>
        )}

        {stats && (
          <>
            {/* Total count */}
            <div className="text-center py-1">
              <span className="text-[24px] font-bold tabular-nums text-white/80">
                {stats.total.toLocaleString()}
              </span>
              <div className="text-[7px] text-white/20 uppercase tracking-[0.2em] mt-0.5">
                Global Installations
              </div>
            </div>

            {/* Category breakdown */}
            <div className="space-y-1.5 border-t border-white/6 pt-2">
              {CATS.map(({ key, label, color, dot, bar }) => {
                const count = stats[key];
                const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                return (
                  <div key={key} className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
                        <span className={`text-[8px] uppercase tracking-wider ${color}`}>
                          {label}
                        </span>
                      </div>
                      <span className="text-[8px] text-white/40 tabular-nums">{count}</span>
                    </div>
                    {/* Mini bar */}
                    <div className="h-px bg-white/6 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${bar} opacity-50 transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div className="text-[7px] text-white/10 pt-1 border-t border-white/5 font-mono">
          OSINT · KML dataset · {stats?.total ?? '—'} entries
        </div>
      </div>
    </div>
  );
}
