import { Siren, TrendingUp, ShieldAlert } from 'lucide-react';
import { useRocketAlerts, type DailyCount } from '../../hooks/useRocketAlerts';

const ALERT_TYPE_LABEL: Record<number, string> = {
  1: 'ROCKET',
  2: 'UAV',
};

/** Bar chart from daily counts — pure CSS, no lib */
function DailyBar({ daily }: { daily: DailyCount[] }) {
  if (!daily.length) return null;
  const max = Math.max(...daily.map((d) => d.alerts), 1);
  return (
    <div className="flex items-end gap-0.5 h-8">
      {daily.map((d) => {
        const pct = Math.max(4, (d.alerts / max) * 100);
        const label = d.timeStamp.slice(5); // MM-DD
        return (
          <div
            key={d.timeStamp}
            className="flex flex-col items-center gap-0.5 flex-1"
            title={`${label}: ${d.alerts}`}
          >
            <div
              className="w-full bg-red-500/50 hover:bg-red-400/70 transition-colors rounded-sm"
              style={{ height: `${pct}%` }}
            />
            <span className="text-[6px] text-white/20 tabular-nums">{label.slice(3)}</span>
          </div>
        );
      })}
    </div>
  );
}

export function RocketAlertWidget() {
  const { data, isLoading, isError } = useRocketAlerts();

  return (
    <div className="flex flex-col h-full gap-0">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 pb-2 border-b border-white/10">
        <div className="flex items-center gap-1.5">
          <Siren
            size={12}
            className={
              data?.isActive
                ? 'text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.9)] animate-pulse'
                : 'text-red-400/50'
            }
          />
          <span className="text-[10px] font-bold uppercase tracking-widest text-intel-text-light">
            Rocket Alerts
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {data?.isActive ? (
            <span className="flex items-center gap-1 text-[8px] text-red-400 font-bold uppercase tracking-wider animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
              LIVE
            </span>
          ) : (
            <span className="text-[8px] text-white/20 uppercase tracking-wider">
              {isLoading ? 'loading...' : 'monitoring'}
            </span>
          )}
        </div>
      </div>

      {/* Source label row — mirrors GPS date-selector height */}
      <div className="flex items-center gap-1.5 shrink-0 py-2 border-b border-white/5">
        <ShieldAlert size={9} className="text-red-400/40 shrink-0" />
        <span className="text-[7px] text-white/25 uppercase tracking-wider">
          rocketalert.live · IL
        </span>
        {data && (
          <span className="ml-auto text-[8px] text-red-400/60 font-bold tabular-nums">
            {data.total24h.toLocaleString()} / 24 h
          </span>
        )}
      </div>

      {isError && (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-[9px] text-red-400/50 font-mono">&gt; feed unavailable</span>
        </div>
      )}

      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-[9px] text-red-400/40 animate-pulse font-mono">
            &gt; connecting...
          </span>
        </div>
      )}

      {data && (
        <div className="flex-1 flex flex-col gap-2 overflow-y-auto custom-scrollbar pt-2">
          {/* 7-day bar chart */}
          {data.daily.length > 0 && (
            <div className="border border-red-500/15 bg-red-500/5 px-2.5 py-2">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1 text-[8px] text-red-400/60 uppercase tracking-wider">
                  <TrendingUp size={8} />
                  7-day trend
                </div>
              </div>
              <DailyBar daily={data.daily} />
            </div>
          )}

          {/* No active alerts */}
          {!data.isActive && (
            <div className="border border-white/5 bg-black/30 px-2.5 py-2 text-center">
              <p className="text-[9px] text-white/20 font-mono">&gt; No active alerts</p>
            </div>
          )}

          {/* Active areas */}
          {data.isActive && data.activeAreas.length > 0 && (
            <div className="border border-red-500/25 bg-red-500/8 px-2.5 py-2">
              <div className="text-[8px] text-red-400/70 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <span className="w-1 h-1 bg-red-500 rounded-full animate-pulse inline-block" />
                Active areas
              </div>
              <div className="flex flex-wrap gap-1">
                {data.activeAreas.map((area) => (
                  <span
                    key={area}
                    className="px-1.5 py-0.5 text-[7px] bg-red-500/15 border border-red-500/25 text-red-300/80 font-bold uppercase tracking-wider"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Live alerts list */}
          {data.live.length > 0 && (
            <div className="space-y-1">
              {data.live.slice(0, 15).map((alert, idx) => {
                const location = alert.englishName ?? alert.name;
                const area = alert.areaNameEn ?? alert.areaNameHe ?? '';
                const typeLabel =
                  ALERT_TYPE_LABEL[alert.alertTypeId] ?? `TYPE ${alert.alertTypeId}`;
                const time = alert.timeStamp.slice(11, 16); // HH:MM
                return (
                  <div
                    key={idx}
                    className="flex items-start justify-between gap-1.5 border-b border-white/5 pb-1.5"
                  >
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-[9px] text-white/70 font-semibold truncate leading-tight">
                        {location}
                      </span>
                      {area && <span className="text-[7px] text-white/25 truncate">{area}</span>}
                    </div>
                    <div className="flex flex-col items-end shrink-0 gap-0.5">
                      <span className="text-[7px] text-red-400/70 font-bold uppercase tracking-wider">
                        {typeLabel}
                      </span>
                      <span className="text-[7px] text-white/20 tabular-nums">{time}</span>
                      {alert.countdownSec != null && alert.countdownSec > 0 && (
                        <span className="text-[7px] text-amber-400/60">{alert.countdownSec}s</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="text-[7px] text-white/15 mt-auto pt-2 border-t border-white/5">
            Refreshes every 30 s · Israel only
          </div>
        </div>
      )}
    </div>
  );
}
