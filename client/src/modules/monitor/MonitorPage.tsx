import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MonitorMap } from './components/MonitorMap';
import { MapLayersWidget } from './components/widgets/MapLayersWidget';
import { RocketAlertWidget } from './components/widgets/RocketAlertWidget';
import { GulfWatchCombinedWidget } from './components/widgets/GulfWatchCombinedWidget';
import { useOsintStore } from '../osint/osint.store';
import { useOsintNews } from '../osint/hooks/useOsintNews';
import { useIntelBrief } from '../osint/hooks/useIntelBrief';
import { BrainCircuit, Sparkles, Rss, GripHorizontal } from 'lucide-react';
import clsx from 'clsx';

const CATEGORIES = [
  'All',
  'Politics & Society',
  'Business & Economy',
  'Science & Technology',
  'Local News',
] as const;

const DATE_FORMATTER = new Intl.DateTimeFormat(undefined, { dateStyle: 'short' });
const TIME_FORMATTER = new Intl.DateTimeFormat(undefined, { timeStyle: 'short' });

const MIN_MAP_PCT = 20;
const MAX_MAP_PCT = 92;
const DEFAULT_MAP_PCT = 80;

// Rotating accent colors for intercept cards
const INTERCEPT_COLORS = [
  { border: 'border-l-blue-500', bg: 'bg-blue-500/8', tag: 'text-blue-400', dot: 'bg-blue-500' },
  {
    border: 'border-l-amber-500',
    bg: 'bg-amber-500/8',
    tag: 'text-amber-400',
    dot: 'bg-amber-500',
  },
  { border: 'border-l-teal-500', bg: 'bg-teal-500/8', tag: 'text-teal-400', dot: 'bg-teal-500' },
  {
    border: 'border-l-purple-500',
    bg: 'bg-purple-500/8',
    tag: 'text-purple-400',
    dot: 'bg-purple-500',
  },
  { border: 'border-l-rose-500', bg: 'bg-rose-500/8', tag: 'text-rose-400', dot: 'bg-rose-500' },
];

function safeFmt(dateStr: string, fmt: Intl.DateTimeFormat): string {
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '' : fmt.format(d);
  } catch {
    return '';
  }
}

/** Extract a short display name from a feed title */
function shortSource(src: string): string {
  return src
    .replace(/\s*[-|–]\s*.+$/, '') // strip " - Full name" suffixes
    .replace(/^The\s+/i, '')
    .trim()
    .toUpperCase()
    .slice(0, 22);
}

export const MonitorPage: React.FC = () => {
  const [mapPct, setMapPct] = useState(DEFAULT_MAP_PCT);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const { currentRegionLat, currentRegionLon, selectedCategory, setSelectedCategory } =
    useOsintStore();
  const {
    data: routeData,
    isLoading,
    isError,
  } = useOsintNews(currentRegionLat, currentRegionLon, selectedCategory, true);
  const intelBrief = useIntelBrief();
  const totalSignals = (routeData?.news.length ?? 0) + (routeData?.intercepts?.length ?? 0);

  // ── Drag resize ────────────────────────────────────────────────────
  const applyY = useCallback((clientY: number) => {
    if (!containerRef.current) return;
    const { top, height } = containerRef.current.getBoundingClientRect();
    const pct = ((clientY - top) / height) * 100;
    setMapPct(Math.min(MAX_MAP_PCT, Math.max(MIN_MAP_PCT, pct)));
  }, []);

  const onDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const onDividerTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    dragging.current = true;
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (dragging.current) applyY(e.clientY);
    };
    const onUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    const onTouch = (e: TouchEvent) => {
      if (dragging.current) applyY(e.touches[0].clientY);
    };
    const onTouchEnd = () => {
      dragging.current = false;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onTouch, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onTouch);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [applyY]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 bg-intel-bg font-mono overflow-hidden z-20 flex flex-col text-intel-text"
    >
      {/* ── Map ── */}
      <div
        className="relative w-full bg-black shrink-0 overflow-hidden"
        style={{ height: `${mapPct}%` }}
      >
        <MonitorMap />
      </div>

      {/* ── Drag Handle ── */}
      <div
        onMouseDown={onDividerMouseDown}
        onTouchStart={onDividerTouchStart}
        className="relative shrink-0 h-3 z-30 cursor-row-resize flex items-center justify-center group bg-[#080c10] border-y border-intel-accent/15 hover:border-intel-accent/40 transition-colors"
      >
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-intel-accent/10 group-hover:bg-intel-accent/25 transition-colors" />
        <div className="relative z-10 flex items-center gap-1.5 px-3 py-0.5 bg-[#080c10] border border-intel-accent/15 group-hover:border-intel-accent/40 transition-colors">
          <GripHorizontal
            size={10}
            className="text-intel-accent/25 group-hover:text-intel-accent/55 transition-colors"
          />
          <span className="text-[7px] text-intel-accent/20 group-hover:text-intel-accent/50 uppercase tracking-[0.25em] select-none transition-colors">
            drag to resize
          </span>
          <GripHorizontal
            size={10}
            className="text-intel-accent/25 group-hover:text-intel-accent/55 transition-colors"
          />
        </div>
      </div>

      {/* ── Dashboard ── */}
      <div className="relative bg-[#07090d] overflow-hidden" style={{ height: `${100 - mapPct}%` }}>
        {/* Subtle dot-grid */}
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(rgba(0,229,255,0.12)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

        <div className="relative z-10 h-full p-3 flex gap-3">
          {/* ══ Map Layers (GPS Jamming + Military Bases) ══ */}
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden rounded-sm border border-white/8 bg-black/50 p-3 hover:border-intel-accent/20 transition-colors">
            <MapLayersWidget />
          </div>

          {/* ══ Rocket Alerts ══ */}
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden rounded-sm border border-white/8 bg-black/50 p-3 hover:border-red-500/25 transition-colors">
            <RocketAlertWidget />
          </div>

          {/* ══ Gulf Watch (UAE + GCC) ══ */}
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden rounded-sm border border-white/8 bg-black/50 p-3 hover:border-orange-500/25 transition-colors">
            <GulfWatchCombinedWidget />
          </div>

          {/* ══ AI Synthesis ══ */}
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden rounded-sm border border-white/8 bg-black/50 p-3 hover:border-purple-500/25 transition-colors">
            {/* Header */}
            <div className="flex items-center justify-between shrink-0 pb-2 border-b border-white/8">
              <div className="flex items-center gap-1.5">
                <BrainCircuit
                  size={12}
                  className="text-purple-400 drop-shadow-[0_0_6px_rgba(168,85,247,0.8)]"
                />
                <span className="text-[10px] font-bold uppercase tracking-widest text-intel-text-light">
                  AI Synthesis
                </span>
              </div>
              {isLoading && (
                <span className="text-[7px] text-purple-400/60 animate-pulse uppercase tracking-widest">
                  Processing...
                </span>
              )}
            </div>

            {/* Category tabs */}
            <div className="flex gap-1 overflow-x-auto no-scrollbar shrink-0 py-2 border-b border-white/5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={clsx(
                    'whitespace-nowrap px-1.5 py-0.5 text-[7px] uppercase font-bold border transition-all',
                    selectedCategory === cat
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/50'
                      : 'bg-transparent text-white/30 border-white/8 hover:border-purple-500/30 hover:text-purple-300/60',
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pt-2 space-y-2">
              {/* Generate Insight card */}
              <div className="border border-purple-500/20 bg-purple-950/20">
                <div className="px-2.5 pt-2.5 pb-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Sparkles size={10} className="text-purple-400/70" />
                    <span className="text-[11px] text-intel-text-light font-semibold tracking-wide">
                      Generate Insight
                    </span>
                  </div>
                  <p className="text-[8px] text-white/25 font-mono mb-2.5 leading-relaxed">
                    {intelBrief.data
                      ? 'Last synthesis complete. Click to regenerate.'
                      : 'Awaiting selection of sector data to process.'}
                  </p>

                  {intelBrief.data && (
                    <div className="text-[9px] text-gray-400 font-mono leading-relaxed mb-2 line-clamp-4">
                      {intelBrief.data.brief}
                    </div>
                  )}
                  {intelBrief.isPending && (
                    <div className="text-[9px] text-purple-400/60 animate-pulse font-mono mb-2">
                      &gt; Parsing incoming signals...
                    </div>
                  )}
                </div>

                {/* Progress-bar style button */}
                <button
                  onClick={() => {
                    if (routeData?.news) {
                      intelBrief.mutate({
                        news: routeData.news,
                        lat: currentRegionLat,
                        lon: currentRegionLon,
                      });
                    }
                  }}
                  disabled={!routeData || routeData.news.length === 0 || intelBrief.isPending}
                  className="w-full relative border-t border-purple-500/20 disabled:opacity-30 group/btn"
                >
                  {/* fill bar */}
                  <div
                    className={clsx(
                      'absolute inset-0 bg-purple-500/15 transition-all duration-300',
                      intelBrief.isPending ? 'w-full animate-pulse' : 'w-0 group-hover/btn:w-full',
                    )}
                  />
                  <span className="relative flex items-center justify-center gap-2 py-1.5 text-[8px] font-bold tracking-[0.2em] uppercase text-purple-300/70 group-hover/btn:text-purple-200 transition-colors">
                    {intelBrief.isPending
                      ? '[...] Processing'
                      : `[${totalSignals > 0 ? totalSignals : '0'}] Initialize Synthesis`}
                  </span>
                </button>
              </div>

              {/* Critical Intercepts */}
              {routeData?.intercepts && routeData.intercepts.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[8px] text-white/30 uppercase tracking-[0.15em]">
                    <span className="w-1 h-1 bg-white/30 rounded-full" />
                    {routeData.intercepts.length} Critical Signal
                    {routeData.intercepts.length > 1 ? 's' : ''}
                  </div>
                  {routeData.intercepts.map((item, idx) => {
                    const c = INTERCEPT_COLORS[idx % INTERCEPT_COLORS.length];
                    return (
                      <div key={idx} className={`border-l-2 ${c.border} ${c.bg} pl-2.5 pr-2 py-2`}>
                        <div className={`flex items-center justify-between mb-1 ${c.tag}`}>
                          <div className="flex items-center gap-1">
                            <span className={`w-1 h-1 rounded-full shrink-0 ${c.dot}`} />
                            <span className="text-[8px] font-bold uppercase tracking-wider opacity-80 truncate">
                              {shortSource(item.source)}
                            </span>
                          </div>
                          <span className="text-[7px] opacity-50 shrink-0 ml-1">
                            {safeFmt(item.pubDate, TIME_FORMATTER)}
                          </span>
                        </div>
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-white/80 font-semibold leading-snug hover:text-white transition-colors block line-clamp-2"
                        >
                          {item.title}
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}

              {isError && (
                <div className="text-[9px] text-red-400/70 p-2 border border-red-500/20 bg-red-500/5 font-mono">
                  &gt; COMMS LINK SEVERED.
                </div>
              )}
            </div>
          </div>

          {/* ══ Live Intel Feed ══ */}
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden rounded-sm border border-white/8 bg-black/50 p-3 hover:border-intel-accent/20 transition-colors">
            {/* Header */}
            <div className="flex items-center justify-between shrink-0 pb-2 border-b border-white/8">
              <div className="flex items-center gap-1.5">
                <Rss
                  size={11}
                  className="text-intel-accent drop-shadow-[0_0_6px_var(--color-intel-accent)]"
                />
                <span className="text-[10px] font-bold uppercase tracking-widest text-intel-text-light">
                  Live Intel Feed
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-[8px]">
                {totalSignals > 0 && (
                  <span className="text-intel-accent/50 tabular-nums">{totalSignals} signals</span>
                )}
                <span className="text-white/20">
                  {currentRegionLat === 0 && currentRegionLon === 0
                    ? 'click map → region'
                    : `${currentRegionLat.toFixed(1)}°, ${currentRegionLon.toFixed(1)}°`}
                </span>
              </div>
            </div>

            {/* Feed list */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pt-2 space-y-0">
              {isLoading && (
                <div className="flex items-center justify-center h-10">
                  <span className="text-[9px] text-intel-accent/30 animate-pulse font-mono">
                    &gt; Intercepting signals...
                  </span>
                </div>
              )}

              {!isLoading && (routeData?.news.length ?? 0) === 0 && !isError && (
                <div className="text-[9px] text-white/20 p-3 text-center font-mono">
                  &gt; No signals detected in sector
                </div>
              )}

              {routeData?.news?.map((item, idx) => (
                <a
                  key={idx}
                  href={item.link}
                  target="_blank"
                  rel="noreferrer"
                  className="group/item flex flex-col gap-0.5 border-b border-white/5 py-2 px-1 hover:bg-white/3 transition-colors"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[8px] text-intel-accent/45 font-bold tracking-wider shrink-0">
                      [{shortSource(item.source)}]
                    </span>
                    <span className="text-[7px] text-white/20 tabular-nums shrink-0">
                      {safeFmt(item.pubDate, DATE_FORMATTER) ||
                        safeFmt(item.pubDate, TIME_FORMATTER)}
                    </span>
                  </div>
                  <p className="text-[10px] text-white/70 font-medium leading-snug group-hover/item:text-white transition-colors line-clamp-2">
                    {item.title}
                  </p>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scanlines */}
      <div className="absolute inset-0 pointer-events-none bg-[url('/scanlines.png')] opacity-[0.04] mix-blend-overlay z-50" />
    </div>
  );
};
