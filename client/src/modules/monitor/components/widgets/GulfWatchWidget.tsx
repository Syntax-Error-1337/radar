import { Shield, AlertTriangle, Clock } from 'lucide-react';
import { useGulfWatchAlerts, useGulfWatchAlertHistory } from '../../hooks/useGulfWatchAlerts';
import type { GulfWatchAlert } from '../../hooks/useGulfWatchAlerts';

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

const SEVERITY_COLOR_DIM: Record<string, { text: string; border: string; bg: string }> = {
  warning: { text: 'text-red-400/40', border: 'border-red-500/15', bg: 'bg-red-500/4' },
  watch: { text: 'text-orange-400/40', border: 'border-orange-500/15', bg: 'bg-orange-500/4' },
  advisory: { text: 'text-yellow-400/40', border: 'border-yellow-500/15', bg: 'bg-yellow-500/4' },
};

function fmt(iso: string) {
  return iso ? iso.slice(0, 16).replace('T', ' ') : '';
}

function AlertCard({ alert, dim = false }: { alert: GulfWatchAlert; dim?: boolean }) {
  const colors = dim
    ? (SEVERITY_COLOR_DIM[alert.severity] ?? SEVERITY_COLOR_DIM.watch)
    : (SEVERITY_COLOR[alert.severity] ?? SEVERITY_COLOR.watch);

  return (
    <div className={`border ${colors.border} ${colors.bg} px-2.5 py-2 rounded-sm`}>
      <div className={`flex items-center justify-between mb-1 ${colors.text}`}>
        <div className="flex items-center gap-1">
          {!dim && (
            <span
              className={`w-1 h-1 rounded-full shrink-0 animate-pulse ${SEVERITY_COLOR[alert.severity]?.dot ?? 'bg-orange-400'}`}
            />
          )}
          <span className="text-[8px] font-bold uppercase tracking-wider">
            {alert.emirateId.replace(/-/g, ' ')}
          </span>
        </div>
        <span className="text-[7px] opacity-60 uppercase tracking-wider">{alert.severity}</span>
      </div>

      <p className="text-[9px] text-white/60 leading-snug line-clamp-2">{alert.description.en}</p>

      <div className="flex items-center justify-between mt-1 text-[7px] text-white/20">
        <span className="uppercase tracking-wider">{alert.type.replace(/-/g, ' ')}</span>
        <span className="tabular-nums">{fmt(alert.startedAt)}</span>
      </div>
    </div>
  );
}

export function GulfWatchWidget() {
  const { data, isLoading, isError } = useGulfWatchAlerts();
  const showHistory = !data?.isActive;
  const { data: history } = useGulfWatchAlertHistory(50);

  return (
    <div className="flex flex-col h-full gap-0">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 pb-2 border-b border-white/10">
        <div className="flex items-center gap-1.5">
          <Shield
            size={12}
            className={
              data?.isActive
                ? 'text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.9)] animate-pulse'
                : 'text-orange-400/50'
            }
          />
          <span className="text-[10px] font-bold uppercase tracking-widest text-intel-text-light">
            Gulf Watch
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {data?.isActive ? (
            <span className="flex items-center gap-1 text-[8px] text-orange-400 font-bold uppercase tracking-wider animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" />
              LIVE
            </span>
          ) : (
            <span className="text-[8px] text-white/20 uppercase tracking-wider">
              {isLoading ? 'loading...' : 'monitoring'}
            </span>
          )}
        </div>
      </div>

      {/* Source row */}
      <div className="flex items-center gap-1.5 shrink-0 py-2 border-b border-white/5">
        <AlertTriangle size={9} className="text-orange-400/40 shrink-0" />
        <span className="text-[7px] text-white/25 uppercase tracking-wider">
          gulfwatch.ai · UAE
        </span>
        {data && (
          <span className="ml-auto text-[8px] text-orange-400/60 font-bold tabular-nums">
            {data.totalActive} active
          </span>
        )}
      </div>

      {isError && (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-[9px] text-orange-400/50 font-mono">&gt; feed unavailable</span>
        </div>
      )}

      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-[9px] text-orange-400/40 animate-pulse font-mono">
            &gt; connecting...
          </span>
        </div>
      )}

      {data && (
        <div className="flex-1 flex flex-col gap-2 overflow-y-auto custom-scrollbar pt-2 min-h-0">
          {/* Live alerts */}
          {data.isActive && data.alerts.length > 0 && (
            <div className="space-y-1.5">
              {data.alerts.slice(0, 10).map((alert) => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
            </div>
          )}

          {/* Historical alerts — shown when no active alerts */}
          {showHistory && (
            <>
              {history && history.alerts.length > 0 ? (
                <>
                  <div className="flex items-center gap-1.5 text-[7px] text-white/20 uppercase tracking-widest">
                    <Clock size={8} className="shrink-0" />
                    Recent History
                  </div>
                  <div className="space-y-1.5">
                    {history.alerts.slice(0, 20).map((alert) => (
                      <AlertCard key={alert.id} alert={alert} dim />
                    ))}
                  </div>
                </>
              ) : (
                <div className="border border-white/5 bg-black/30 px-2.5 py-2 text-center">
                  <p className="text-[9px] text-white/20 font-mono">&gt; No active alerts</p>
                </div>
              )}
            </>
          )}

          <div className="text-[7px] text-white/15 mt-auto pt-2 border-t border-white/5 shrink-0">
            Refreshes every 60 s · UAE only
          </div>
        </div>
      )}
    </div>
  );
}
