import { useState } from 'react';
import { Globe, Clock } from 'lucide-react';
import {
  GCC_COUNTRIES,
  GCC_COUNTRY_LABEL,
  useGccCountryAlerts,
  useGccCountryHistory,
} from '../../hooks/useGulfWatchAlerts';
import type { GccCountry, GulfWatchAlert } from '../../hooks/useGulfWatchAlerts';

const SEVERITY_COLOR: Record<string, { text: string; border: string; bg: string; dot: string }> = {
  warning: {
    text: 'text-red-400',
    border: 'border-red-500/30',
    bg: 'bg-red-500/8',
    dot: 'bg-red-400',
  },
  watch: {
    text: 'text-orange-400',
    border: 'border-orange-500/30',
    bg: 'bg-orange-500/8',
    dot: 'bg-orange-400',
  },
  advisory: {
    text: 'text-yellow-400',
    border: 'border-yellow-500/30',
    bg: 'bg-yellow-500/6',
    dot: 'bg-yellow-400',
  },
};

const SEVERITY_DIM: Record<string, { text: string; border: string; bg: string }> = {
  warning: { text: 'text-red-400/40', border: 'border-red-500/15', bg: 'bg-red-500/4' },
  watch: { text: 'text-orange-400/40', border: 'border-orange-500/15', bg: 'bg-orange-500/4' },
  advisory: { text: 'text-yellow-400/40', border: 'border-yellow-500/15', bg: 'bg-yellow-500/4' },
};

function fmt(iso: string) {
  return iso ? iso.slice(0, 16).replace('T', ' ') : '';
}

function AlertCard({ alert, dim = false }: { alert: GulfWatchAlert; dim?: boolean }) {
  const colors = dim
    ? (SEVERITY_DIM[alert.severity] ?? SEVERITY_DIM.advisory)
    : (SEVERITY_COLOR[alert.severity] ?? SEVERITY_COLOR.advisory);
  const dot = SEVERITY_COLOR[alert.severity]?.dot ?? 'bg-yellow-400';

  return (
    <div className={`border ${colors.border} ${colors.bg} px-2 py-1.5 rounded-sm`}>
      <div className={`flex items-center justify-between mb-0.5 ${colors.text}`}>
        <div className="flex items-center gap-1">
          {!dim && <span className={`w-1 h-1 rounded-full shrink-0 animate-pulse ${dot}`} />}
          <span className="text-[8px] font-bold uppercase tracking-wider">
            {alert.emirateId.replace(/-/g, ' ')}
          </span>
        </div>
        <span className="text-[7px] opacity-60 uppercase">{alert.severity}</span>
      </div>
      <p className="text-[8px] text-white/55 leading-snug line-clamp-2">{alert.description.en}</p>
      <div className="flex justify-between mt-0.5 text-[7px] text-white/20">
        <span className="uppercase tracking-wider">{alert.type.replace(/-/g, ' ')}</span>
        <span className="tabular-nums">{fmt(alert.startedAt)}</span>
      </div>
    </div>
  );
}

function CountryPanel({ country }: { country: GccCountry }) {
  const { data: live, isLoading } = useGccCountryAlerts(country);
  const { data: history } = useGccCountryHistory(country, 15);

  const isActive = live?.isActive ?? false;

  return (
    <div className="flex flex-col gap-1.5 overflow-y-auto custom-scrollbar flex-1 min-h-0">
      {isLoading && (
        <span className="text-[8px] text-white/20 animate-pulse font-mono">&gt; connecting...</span>
      )}

      {/* Live alerts */}
      {isActive && (live?.alerts ?? []).length > 0 && (
        <div className="space-y-1">
          {live!.alerts.slice(0, 8).map((a) => (
            <AlertCard key={a.id} alert={a} />
          ))}
        </div>
      )}

      {/* Historical fallback */}
      {!isActive && (
        <>
          {(history?.alerts ?? []).length > 0 ? (
            <>
              <div className="flex items-center gap-1 text-[7px] text-white/20 uppercase tracking-widest">
                <Clock size={7} className="shrink-0" />
                Recent History
              </div>
              <div className="space-y-1">
                {history!.alerts.slice(0, 10).map((a) => (
                  <AlertCard key={a.id} alert={a} dim />
                ))}
              </div>
            </>
          ) : (
            <div className="text-[8px] text-white/15 font-mono text-center py-3">
              &gt; No active alerts
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function GccWatchWidget() {
  const [activeTab, setActiveTab] = useState<GccCountry>('qatar');

  // Peek at active status for each country to show indicator dots on tabs
  const qatarData = useGccCountryAlerts('qatar');
  const bahrainData = useGccCountryAlerts('bahrain');
  const kuwaitData = useGccCountryAlerts('kuwait');
  const omanData = useGccCountryAlerts('oman');

  const activeMap: Record<GccCountry, boolean> = {
    qatar: qatarData.data?.isActive ?? false,
    bahrain: bahrainData.data?.isActive ?? false,
    kuwait: kuwaitData.data?.isActive ?? false,
    oman: omanData.data?.isActive ?? false,
  };

  const anyActive = Object.values(activeMap).some(Boolean);

  return (
    <div className="flex flex-col h-full gap-0">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 pb-2 border-b border-white/10">
        <div className="flex items-center gap-1.5">
          <Globe
            size={12}
            className={
              anyActive
                ? 'text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.9)] animate-pulse'
                : 'text-orange-400/50'
            }
          />
          <span className="text-[10px] font-bold uppercase tracking-widest text-intel-text-light">
            GCC Watch
          </span>
        </div>
        <span className="text-[8px] text-white/20 uppercase tracking-wider">
          {anyActive ? (
            <span className="text-orange-400 animate-pulse font-bold">LIVE</span>
          ) : (
            'monitoring'
          )}
        </span>
      </div>

      {/* Country tabs */}
      <div className="flex gap-0.5 shrink-0 py-1.5 border-b border-white/5">
        {GCC_COUNTRIES.map((c) => (
          <button
            key={c}
            onClick={() => setActiveTab(c)}
            className={`
              relative flex-1 py-0.5 text-[7px] font-bold uppercase tracking-wider transition-all border
              ${
                activeTab === c
                  ? 'bg-orange-500/15 text-orange-300 border-orange-500/40'
                  : 'bg-transparent text-white/25 border-white/8 hover:text-white/50 hover:border-white/20'
              }
            `}
          >
            {GCC_COUNTRY_LABEL[c]}
            {activeMap[c] && (
              <span className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full bg-orange-400 animate-pulse" />
            )}
          </button>
        ))}
      </div>

      {/* Panel */}
      <div className="flex-1 pt-1.5 min-h-0 flex flex-col">
        <CountryPanel country={activeTab} />
      </div>

      <div className="text-[7px] text-white/15 pt-1.5 border-t border-white/5 shrink-0">
        gulfwatch.ai · Qatar · Bahrain · Kuwait · Oman
      </div>
    </div>
  );
}
