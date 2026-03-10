import { useState } from 'react';
import {
  Layers,
  Activity,
  Shield,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
} from 'lucide-react';
import clsx from 'clsx';
import { useGPSJammingStore } from '../../gpsJamming.store';
import { useGPSJammingData } from '../../hooks/useGPSJammingData';
import { useMilitaryBasesStore } from '../../militaryBases.store';
import { useMilitaryBaseStats } from '../../hooks/useMilitaryBases';

// ── Types ─────────────────────────────────────────────────────────────────────

type ActiveTab = 'gps' | 'bases';

// ── GPS Jamming tab ───────────────────────────────────────────────────────────

function GpsTab() {
  const { data, loading, enabled, setEnabled } = useGPSJammingData();
  const {
    availableDates,
    selectedDate,
    setSelectedDate,
    showCleanSignals,
    showInterferedSignals,
    showMixedSignals,
    setShowCleanSignals,
    setShowInterferedSignals,
    setShowMixedSignals,
  } = useGPSJammingStore();

  const stats = data
    ? {
        total: data.totalCells,
        clean: data.cells.filter((c) => c.interference <= 0.02).length,
        mixed: data.cells.filter((c) => c.interference > 0.02 && c.interference <= 0.1).length,
        interfered: data.cells.filter((c) => c.interference > 0.1).length,
      }
    : null;

  return (
    <div className="flex flex-col h-full min-h-0 gap-0">
      {/* Layer toggle */}
      <div className="flex items-center justify-between shrink-0 py-1.5 border-b border-white/5">
        <div className="flex items-center gap-1">
          <Activity
            size={9}
            className={clsx(
              'transition-all',
              enabled
                ? 'text-orange-400 drop-shadow-[0_0_5px_rgba(255,150,0,0.8)]'
                : 'text-orange-400/30',
            )}
          />
          <span className="text-[8px] text-white/40 uppercase tracking-wider">GPS Jamming</span>
        </div>
        <button
          onClick={() => setEnabled(!enabled)}
          className={clsx(
            'text-[7px] px-2 py-0.5 font-bold border transition-all',
            enabled
              ? 'bg-orange-500/25 text-orange-300 border-orange-500/60 shadow-[0_0_6px_rgba(255,150,0,0.2)]'
              : 'bg-black/50 text-white/30 border-white/12 hover:border-orange-500/40 hover:text-orange-400/60',
          )}
        >
          {enabled ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Date picker */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0 py-1.5 border-b border-white/5">
        <CalendarDays size={8} className="text-orange-400/40 shrink-0" />
        {availableDates.length > 0 ? (
          <>
            <button
              onClick={() => setSelectedDate(null)}
              className={clsx(
                'whitespace-nowrap px-1.5 py-0.5 text-[7px] uppercase font-bold border transition-colors',
                selectedDate === null
                  ? 'bg-orange-500/20 text-orange-300 border-orange-500/50'
                  : 'bg-transparent text-intel-text border-white/10 hover:border-orange-500/30 hover:text-orange-400/60',
              )}
            >
              Latest
            </button>
            {availableDates.slice(0, 4).map((date) => (
              <button
                key={date}
                onClick={() => setSelectedDate(selectedDate === date ? null : date)}
                className={clsx(
                  'whitespace-nowrap px-1.5 py-0.5 text-[7px] uppercase font-bold border transition-colors',
                  selectedDate === date
                    ? 'bg-orange-500/20 text-orange-300 border-orange-500/50'
                    : 'bg-transparent text-intel-text border-white/10 hover:border-orange-500/30 hover:text-orange-400/60',
                )}
              >
                {date.slice(5)}
              </button>
            ))}
          </>
        ) : (
          <span className="text-[8px] text-white/20">No datasets</span>
        )}
      </div>

      {/* Disabled placeholder */}
      {!enabled && (
        <div className="flex-1 relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: [
                'radial-gradient(ellipse 55% 45% at 38% 58%, rgba(220,38,38,0.85) 0%, transparent 65%)',
                'radial-gradient(ellipse 40% 35% at 62% 42%, rgba(251,146,60,0.6) 0%, transparent 60%)',
                'radial-gradient(ellipse 30% 25% at 25% 35%, rgba(250,204,21,0.4) 0%, transparent 55%)',
              ].join(', '),
            }}
          />
          <div className="absolute inset-0 opacity-8 bg-[linear-gradient(rgba(255,255,255,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.15)_1px,transparent_1px)] bg-[size:12px_12px]" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 px-3 text-center">
            <Activity size={14} className="text-orange-400/25" />
            <p className="text-[8px] text-white/25 leading-relaxed font-mono">
              Activate to view
              <br />
              interference pattern
            </p>
          </div>
        </div>
      )}

      {enabled && loading && (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-orange-400/50 animate-pulse text-[8px] font-mono">
            &gt; Syncing...
          </span>
        </div>
      )}

      {enabled && !loading && stats && (
        <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto custom-scrollbar pt-1.5 min-h-0">
          {/* Total */}
          <div className="flex items-center justify-between px-2 py-1 border border-white/8 bg-white/3">
            <span className="text-[7px] text-white/35 uppercase tracking-wider">Total Cells</span>
            <span className="text-[13px] font-bold text-intel-accent tabular-nums">
              {stats.total.toLocaleString()}
            </span>
          </div>

          {/* Stat bars */}
          {[
            {
              icon: <CheckCircle2 size={8} />,
              label: 'Low',
              sub: '0–2%',
              count: stats.clean,
              border: 'border-green-500/30',
              bg: 'bg-green-500/5',
              text: 'text-green-400',
              bar: 'bg-green-500',
            },
            {
              icon: <AlertCircle size={8} />,
              label: 'Med',
              sub: '2–10%',
              count: stats.mixed,
              border: 'border-yellow-500/30',
              bg: 'bg-yellow-500/5',
              text: 'text-yellow-400',
              bar: 'bg-yellow-500',
            },
            {
              icon: <AlertTriangle size={8} />,
              label: 'High',
              sub: '>10%',
              count: stats.interfered,
              border: 'border-red-500/30',
              bg: 'bg-red-500/5',
              text: 'text-red-400',
              bar: 'bg-red-500',
            },
          ].map(({ icon, label, sub, count, border, bg, text, bar }) => {
            const pct = ((count / stats.total) * 100).toFixed(1);
            return (
              <div key={label} className={`border ${border} ${bg} px-2 py-1`}>
                <div className={`flex items-center justify-between mb-0.5 ${text}`}>
                  <div className="flex items-center gap-1 text-[7px] uppercase tracking-wider opacity-80">
                    {icon}
                    <span>{label}</span>
                    <span className="opacity-40">({sub})</span>
                  </div>
                  <div className="flex items-center gap-1 text-[7px] tabular-nums">
                    <span className="font-bold text-[9px]">{count.toLocaleString()}</span>
                    <span className="opacity-40">{pct}%</span>
                  </div>
                </div>
                <div className="h-px bg-white/5 overflow-hidden">
                  <div className={`h-full ${bar} opacity-70`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}

          {/* Filters */}
          <div className="border-t border-white/8 pt-1.5">
            <div className="text-[7px] text-white/25 uppercase tracking-wider mb-1">
              Map Filters
            </div>
            <div className="space-y-1">
              {[
                {
                  checked: showCleanSignals,
                  onChange: setShowCleanSignals,
                  color: 'border-green-500/50',
                  dot: 'bg-green-500/80',
                  label: 'Low',
                },
                {
                  checked: showMixedSignals,
                  onChange: setShowMixedSignals,
                  color: 'border-yellow-500/50',
                  dot: 'bg-yellow-500/80',
                  label: 'Medium',
                },
                {
                  checked: showInterferedSignals,
                  onChange: setShowInterferedSignals,
                  color: 'border-red-500/50',
                  dot: 'bg-red-500/80',
                  label: 'High',
                },
              ].map(({ checked, onChange, color, dot, label }) => (
                <label key={label} className="flex items-center gap-1.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                    className={`w-2.5 h-2.5 rounded border-2 bg-black/50 focus:outline-none cursor-pointer ${color}`}
                  />
                  <span className={`w-1.5 h-1.5 rounded-sm shrink-0 ${dot}`} />
                  <span className="text-[8px] text-white/50 group-hover:text-white transition-colors">
                    {label} Interference
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="text-[7px] text-white/15 mt-auto pt-1.5 border-t border-white/5 shrink-0">
            <span className="text-orange-400/40">gpsjam.org</span>
            {data?.date && <span className="ml-1 text-white/15">· {data.date}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Military Bases tab ────────────────────────────────────────────────────────

const CAT_FILTERS = [
  {
    key: 'Air' as const,
    store: 'showAir' as const,
    label: 'Air Base',
    color: 'text-sky-400',
    dot: 'bg-sky-400',
    border: 'border-sky-500/40',
    activeBg: 'bg-sky-500/15',
  },
  {
    key: 'Naval' as const,
    store: 'showNaval' as const,
    label: 'Naval',
    color: 'text-cyan-400',
    dot: 'bg-cyan-400',
    border: 'border-cyan-500/40',
    activeBg: 'bg-cyan-500/15',
  },
  {
    key: 'Ground' as const,
    store: 'showGround' as const,
    label: 'Ground',
    color: 'text-green-400',
    dot: 'bg-green-400',
    border: 'border-green-500/40',
    activeBg: 'bg-green-500/15',
  },
  {
    key: 'Hq' as const,
    store: 'showHq' as const,
    label: 'HQ / Cmd',
    color: 'text-amber-400',
    dot: 'bg-amber-400',
    border: 'border-amber-500/40',
    activeBg: 'bg-amber-500/15',
  },
] as const;

const STAT_KEYS = ['air', 'naval', 'ground', 'hq'] as const;

function BasesTab() {
  const store = useMilitaryBasesStore();
  const { data: stats, isLoading } = useMilitaryBaseStats();

  const filterMap: Record<(typeof CAT_FILTERS)[number]['store'], boolean> = {
    showAir: store.showAir,
    showNaval: store.showNaval,
    showGround: store.showGround,
    showHq: store.showHq,
  };

  const setterMap = {
    showAir: store.setShowAir,
    showNaval: store.setShowNaval,
    showGround: store.setShowGround,
    showHq: store.setShowHq,
  };

  return (
    <div className="flex flex-col h-full min-h-0 gap-0">
      {/* Layer toggle */}
      <div className="flex items-center justify-between shrink-0 py-1.5 border-b border-white/5">
        <div className="flex items-center gap-1">
          <Shield
            size={9}
            className={clsx(
              'transition-all',
              store.enabled
                ? 'text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.8)]'
                : 'text-green-400/30',
            )}
          />
          <span className="text-[8px] text-white/40 uppercase tracking-wider">Military Bases</span>
        </div>
        <button
          onClick={() => store.setEnabled(!store.enabled)}
          className={clsx(
            'text-[7px] px-2 py-0.5 font-bold border transition-all',
            store.enabled
              ? 'bg-green-500/20 text-green-300 border-green-500/50'
              : 'bg-black/50 text-white/30 border-white/12 hover:border-green-500/40 hover:text-green-400/60',
          )}
        >
          {store.enabled ? 'ON' : 'OFF'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pt-1.5 space-y-2 min-h-0">
        {isLoading && (
          <span className="text-[8px] text-white/20 animate-pulse font-mono">&gt; Indexing...</span>
        )}

        {stats && (
          <>
            {/* Total */}
            <div className="text-center py-1">
              <span className="text-[22px] font-bold tabular-nums text-white/75">
                {stats.total.toLocaleString()}
              </span>
              <div className="text-[7px] text-white/20 uppercase tracking-[0.2em] mt-0.5">
                Global Installations
              </div>
            </div>

            {/* Category filters + counts */}
            <div className="space-y-1 border-t border-white/6 pt-1.5">
              <div className="text-[7px] text-white/25 uppercase tracking-wider mb-1">
                Category Filter
              </div>
              {CAT_FILTERS.map(({ store: storeKey, label, color, dot, border, activeBg }) => {
                const isOn = filterMap[storeKey];
                const statKey = STAT_KEYS[CAT_FILTERS.findIndex((f) => f.store === storeKey)];
                const count = stats[statKey];
                const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                return (
                  <button
                    key={storeKey}
                    onClick={() => setterMap[storeKey](!isOn)}
                    className={clsx(
                      'w-full flex items-center justify-between px-2 py-1 border transition-all rounded-sm text-left',
                      isOn ? `${activeBg} ${border}` : 'bg-transparent border-white/8 opacity-40',
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${isOn ? dot : 'bg-white/20'}`}
                      />
                      <span
                        className={`text-[8px] font-bold uppercase tracking-wider ${isOn ? color : 'text-white/40'}`}
                      >
                        {label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-px bg-white/8 overflow-hidden">
                        <div
                          className={`h-full ${dot} opacity-60 transition-all`}
                          style={{ width: isOn ? `${pct}%` : '0%' }}
                        />
                      </div>
                      <span className="text-[8px] text-white/40 tabular-nums w-7 text-right">
                        {count}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        <div className="text-[7px] text-white/10 pt-1 border-t border-white/5 font-mono">
          OSINT · KML · {stats?.total ?? '—'} entries
        </div>
      </div>
    </div>
  );
}

// ── Combined Map Layers widget ────────────────────────────────────────────────

export function MapLayersWidget() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('gps');
  const gpsEnabled = useGPSJammingStore((s) => s.enabled);
  const basesEnabled = useMilitaryBasesStore((s) => s.enabled);

  return (
    <div className="flex flex-col h-full gap-0">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 pb-2 border-b border-white/10">
        <div className="flex items-center gap-1.5">
          <Layers
            size={12}
            className="text-intel-accent/70 drop-shadow-[0_0_6px_var(--color-intel-accent)]"
          />
          <span className="text-[10px] font-bold uppercase tracking-widest text-intel-text-light">
            Map Layers
          </span>
        </div>
        {/* Active layer indicators */}
        <div className="flex items-center gap-1.5">
          {gpsEnabled && (
            <span className="text-[7px] text-orange-400/70 font-bold uppercase tracking-wider">
              GPS
            </span>
          )}
          {basesEnabled && (
            <span className="text-[7px] text-green-400/70 font-bold uppercase tracking-wider">
              BASES
            </span>
          )}
          {!gpsEnabled && !basesEnabled && (
            <span className="text-[7px] text-white/20 uppercase tracking-wider">idle</span>
          )}
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-0.5 shrink-0 py-1.5 border-b border-white/5">
        {(
          [
            {
              id: 'gps' as ActiveTab,
              icon: <Activity size={9} />,
              label: 'GPS JAM',
              activeColor: 'bg-orange-500/15 text-orange-300 border-orange-500/40',
              dotColor: 'bg-orange-400',
              isOn: gpsEnabled,
            },
            {
              id: 'bases' as ActiveTab,
              icon: <Shield size={9} />,
              label: 'MIL BASES',
              activeColor: 'bg-green-500/15 text-green-300 border-green-500/40',
              dotColor: 'bg-green-400',
              isOn: basesEnabled,
            },
          ] as const
        ).map(({ id, icon, label, activeColor, dotColor, isOn }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={clsx(
              'relative flex-1 flex items-center justify-center gap-1 py-0.5 text-[7px] font-bold uppercase tracking-wider transition-all border',
              activeTab === id
                ? activeColor
                : 'bg-transparent text-white/25 border-white/8 hover:text-white/50 hover:border-white/20',
            )}
          >
            {icon}
            {label}
            {isOn && (
              <span
                className={`absolute top-0.5 right-0.5 w-1 h-1 rounded-full ${dotColor} animate-pulse`}
              />
            )}
          </button>
        ))}
      </div>

      {/* Panel */}
      <div className="flex-1 pt-1.5 min-h-0 overflow-hidden flex flex-col">
        {activeTab === 'gps' ? <GpsTab /> : <BasesTab />}
      </div>
    </div>
  );
}
