import { useRef, useEffect, useCallback, useState } from 'react';
import Map, { NavigationControl, Popup } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { MapRef } from 'react-map-gl/maplibre';
import type { MapLayerMouseEvent, ProjectionSpecification } from 'maplibre-gl';
import { useThemeStore } from '../../../ui/theme/theme.store';
import { SATELLITE_STYLE, DARK_STYLE } from '../../../lib/mapStyles';
import { useOsintStore } from '../../osint/osint.store';
import { GPSJammingLayer } from './GPSJammingLayer';
import { RocketAlertLayer } from './RocketAlertLayer';
import { GulfWatchLayer } from './GulfWatchLayer';
import { GccWatchLayer } from './GccWatchLayer';
import { MilitaryBasesLayer } from './MilitaryBasesLayer';
import {
  MILITARY_BASES_LAYER_IDS,
  ROCKET_ALERT_LAYER_IDS,
  GULF_WATCH_LAYER_IDS,
  GCC_WATCH_LAYER_IDS,
} from './layerIds';
import { useGPSJammingStore } from '../gpsJamming.store';

const ALL_INTERACTIVE_LAYERS = [
  ...MILITARY_BASES_LAYER_IDS,
  ...ROCKET_ALERT_LAYER_IDS,
  ...GULF_WATCH_LAYER_IDS,
  ...GCC_WATCH_LAYER_IDS,
];

const INITIAL_VIEW_STATE = {
  longitude: 0,
  latitude: 20,
  zoom: 1.5,
};

interface MilitaryPopup {
  kind: 'military';
  lng: number;
  lat: number;
  name: string;
  description: string;
  category: string;
  country: string;
}

interface RocketPopup {
  kind: 'rocket';
  lng: number;
  lat: number;
  nameEn: string;
  nameHe: string;
  area: string;
  areaHe: string;
  alertTypeId: number;
  countdownSec: number;
  timeStamp: string;
}

interface GulfPopup {
  kind: 'gulf';
  lng: number;
  lat: number;
  nameEn: string;
  nameAr: string;
  alertType: string;
  alertSeverity: string;
  descriptionEn: string;
  descriptionAr: string;
  startedAt: string;
  expiresAt: string;
  sourceCount: number;
  country?: string;
}

type ActivePopup = MilitaryPopup | RocketPopup | GulfPopup;

const ROCKET_TYPE_LABEL: Record<number, string> = { 1: 'ROCKET', 2: 'UAV' };

export function MonitorMap() {
  const mapRef = useRef<MapRef>(null);
  const { mapLayer, mapProjection } = useThemeStore();
  const { setCurrentRegion } = useOsintStore();
  const gpsJammingEnabled = useGPSJammingStore((s) => s.enabled);
  const [popup, setPopup] = useState<ActivePopup | null>(null);

  const activeMapStyle = mapLayer === 'satellite' ? SATELLITE_STYLE : DARK_STYLE;

  const onClick = useCallback(
    (e: MapLayerMouseEvent) => {
      const feature = e.features?.[0];

      if (feature && MILITARY_BASES_LAYER_IDS.includes(feature.layer.id)) {
        const p = feature.properties as Record<string, unknown>;
        setPopup({
          kind: 'military',
          lng: (feature.geometry as GeoJSON.Point).coordinates[0],
          lat: (feature.geometry as GeoJSON.Point).coordinates[1],
          name: String(p.name ?? ''),
          description: String(p.description ?? ''),
          category: String(p.category ?? 'hq'),
          country: String(p.country ?? ''),
        });
        return;
      }

      if (feature && ROCKET_ALERT_LAYER_IDS.includes(feature.layer.id)) {
        const p = feature.properties as Record<string, unknown>;
        setPopup({
          kind: 'rocket',
          lng: (feature.geometry as GeoJSON.Point).coordinates[0],
          lat: (feature.geometry as GeoJSON.Point).coordinates[1],
          nameEn: String(p.nameEn ?? ''),
          nameHe: String(p.nameHe ?? ''),
          area: String(p.area ?? ''),
          areaHe: String(p.areaHe ?? ''),
          alertTypeId: Number(p.alertTypeId ?? 1),
          countdownSec: Number(p.countdownSec ?? 0),
          timeStamp: String(p.timeStamp ?? ''),
        });
        return;
      }

      const isGulfLayer = GULF_WATCH_LAYER_IDS.includes(feature?.layer.id ?? '');
      const isGccLayer = GCC_WATCH_LAYER_IDS.includes(feature?.layer.id ?? '');

      if (feature && (isGulfLayer || isGccLayer)) {
        const p = feature.properties as Record<string, unknown>;
        if (!p.isActive) {
          setPopup(null);
          return;
        }
        // Use centroid coords for marker clicks, lngLat for polygon clicks
        const isMarker = feature.geometry?.type === 'Point';
        const coords = isMarker
          ? (feature.geometry as GeoJSON.Point).coordinates
          : [e.lngLat.lng, e.lngLat.lat];
        setPopup({
          kind: 'gulf',
          lng: coords[0],
          lat: coords[1],
          nameEn: String(p.name_en ?? ''),
          nameAr: String(p.name_ar ?? ''),
          alertType: String(p.alertType ?? ''),
          alertSeverity: String(p.alertSeverity ?? ''),
          descriptionEn: String(p.descriptionEn ?? ''),
          descriptionAr: String(p.descriptionAr ?? ''),
          startedAt: String(p.startedAt ?? ''),
          expiresAt: String(p.expiresAt ?? ''),
          sourceCount: Number(p.sourceCount ?? 0),
          country: String(p.country ?? 'UAE'),
        });
        return;
      }

      setPopup(null);
      setCurrentRegion(e.lngLat.lat, e.lngLat.lng);
    },
    [setCurrentRegion],
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (mapRef.current) mapRef.current.resize();
    }, 100);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="w-full h-full relative bg-black">
      <Map
        ref={mapRef}
        initialViewState={INITIAL_VIEW_STATE}
        mapStyle={activeMapStyle}
        styleDiffing={false}
        onClick={onClick}
        cursor="crosshair"
        interactiveLayerIds={ALL_INTERACTIVE_LAYERS}
        projection={
          mapProjection === 'globe'
            ? ({ type: 'globe' } as ProjectionSpecification)
            : ({ type: 'mercator' } as ProjectionSpecification)
        }
        doubleClickZoom={mapProjection !== 'globe'}
        style={{ width: '100%', height: '100%' }}
      >
        <NavigationControl position="top-right" showCompass={true} visualizePitch={true} />

        {gpsJammingEnabled && <GPSJammingLayer />}
        <MilitaryBasesLayer />
        <GulfWatchLayer />
        <GccWatchLayer />
        <RocketAlertLayer />

        {/* Popups */}
        {popup && (
          <Popup
            longitude={popup.lng}
            latitude={popup.lat}
            anchor="bottom"
            offset={16}
            closeButton={false}
            onClose={() => setPopup(null)}
          >
            {popup.kind === 'military' ? (
              <MilitaryPopupCard popup={popup} onClose={() => setPopup(null)} />
            ) : popup.kind === 'rocket' ? (
              <RocketPopupCard popup={popup} onClose={() => setPopup(null)} />
            ) : (
              <GulfPopupCard popup={popup} onClose={() => setPopup(null)} />
            )}
          </Popup>
        )}
      </Map>

      <div className="absolute top-3 left-3 pointer-events-none z-10 tech-panel px-3 py-1.5 shadow-lg">
        <div className="flex items-center gap-2 text-[11px] font-mono font-bold tracking-wider text-intel-text-light uppercase">
          <span className="w-1.5 h-1.5 bg-intel-accent rounded-full animate-pulse shadow-[0_0_6px_var(--color-intel-accent)]" />
          Global Monitor
        </div>
      </div>

      {/* UAE status legend */}
      <GulfWatchLegend />
    </div>
  );
}

// ── Popup sub-components ──────────────────────────────────────────────────────

function PopupShell({
  accentClass,
  headerBgClass,
  headerBorderClass,
  dot,
  label,
  onClose,
  children,
}: {
  accentClass: string;
  headerBgClass: string;
  headerBorderClass: string;
  dot: string;
  label: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="font-mono bg-[#070a0f] border border-white/10 rounded-sm min-w-[210px] max-w-[250px] overflow-hidden shadow-lg"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className={`flex items-center justify-between px-2.5 py-1.5 border-b ${headerBgClass} ${headerBorderClass}`}
      >
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${dot}`} />
          <span className={`text-[9px] font-bold uppercase tracking-[0.15em] ${accentClass}`}>
            {label}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-white/25 hover:text-white/60 transition-colors text-[10px] leading-none ml-2"
        >
          ✕
        </button>
      </div>
      <div className="px-2.5 py-2 space-y-1.5">{children}</div>
    </div>
  );
}

function Row({
  label,
  value,
  valueClass = 'text-white/55',
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between text-[8px] gap-2">
      <span className="text-white/25 uppercase tracking-wider shrink-0">{label}</span>
      <span className={`${valueClass} tabular-nums text-right`}>{value}</span>
    </div>
  );
}

function RocketPopupCard({ popup, onClose }: { popup: RocketPopup; onClose: () => void }) {
  const isUAV = popup.alertTypeId === 2;
  return (
    <PopupShell
      accentClass={isUAV ? 'text-orange-400' : 'text-red-400'}
      headerBgClass={isUAV ? 'bg-orange-500/10' : 'bg-red-500/10'}
      headerBorderClass={isUAV ? 'border-orange-500/25' : 'border-red-500/25'}
      dot={isUAV ? 'bg-orange-400' : 'bg-red-400'}
      label={`${ROCKET_TYPE_LABEL[popup.alertTypeId] ?? 'ALERT'} · Israel`}
      onClose={onClose}
    >
      <div>
        <p className="text-white/90 font-semibold text-[12px] leading-snug">
          {popup.nameEn || popup.nameHe}
        </p>
        {popup.nameEn && popup.nameHe && (
          <p className="text-white/30 text-[9px]" dir="rtl">
            {popup.nameHe}
          </p>
        )}
      </div>
      {popup.area && (
        <Row
          label="Area"
          value={`${popup.area}${popup.areaHe && popup.areaHe !== popup.area ? ' · ' + popup.areaHe : ''}`}
        />
      )}
      {popup.countdownSec > 0 && (
        <div className="border border-amber-500/25 bg-amber-500/8 px-2 py-1 flex items-center justify-between">
          <span className="text-[8px] text-amber-400/70 uppercase tracking-wider">
            Time to shelter
          </span>
          <span className="text-[11px] font-bold text-amber-300 tabular-nums">
            {popup.countdownSec}s
          </span>
        </div>
      )}
      <div className="border-t border-white/6 pt-1 space-y-1">
        <Row label="Coords" value={`${popup.lat.toFixed(4)}°, ${popup.lng.toFixed(4)}°`} />
        <Row label="Time (IL)" value={popup.timeStamp.slice(0, 16)} />
      </div>
    </PopupShell>
  );
}

const CATEGORY_META: Record<string, { label: string; color: string; textClass: string }> = {
  air: { label: 'Air Base', color: '#38bdf8', textClass: 'text-sky-400' },
  naval: { label: 'Naval', color: '#22d3ee', textClass: 'text-cyan-400' },
  ground: { label: 'Ground', color: '#4ade80', textClass: 'text-green-400' },
  hq: { label: 'HQ / Cmd', color: '#fbbf24', textClass: 'text-amber-400' },
};

function MilitaryPopupCard({ popup, onClose }: { popup: MilitaryPopup; onClose: () => void }) {
  const meta = CATEGORY_META[popup.category] ?? CATEGORY_META.hq;
  return (
    <PopupShell
      accentClass={meta.textClass}
      headerBgClass="bg-white/4"
      headerBorderClass="border-white/10"
      dot=""
      label={`${meta.label} · ${popup.country}`}
      onClose={onClose}
    >
      <div className="flex items-start gap-1.5">
        <span
          className="w-2 h-2 rounded-full shrink-0 mt-0.5"
          style={{ background: meta.color, boxShadow: `0 0 6px ${meta.color}88` }}
        />
        <p className="text-white/90 font-semibold text-[12px] leading-snug">{popup.name}</p>
      </div>
      {popup.description && (
        <p className="text-[9px] text-white/45 leading-relaxed border-l-2 border-white/10 pl-2">
          {popup.description.slice(0, 160)}
          {popup.description.length > 160 ? '…' : ''}
        </p>
      )}
      <div className="border-t border-white/6 pt-1 space-y-1">
        <Row label="Category" value={meta.label} valueClass={meta.textClass} />
        <Row label="Country" value={popup.country} />
        <Row label="Coords" value={`${popup.lat.toFixed(4)}°, ${popup.lng.toFixed(4)}°`} />
      </div>
    </PopupShell>
  );
}

const UAE_LEGEND = [
  { color: 'rgba(239,68,68,0.8)', label: 'Warning' },
  { color: 'rgba(251,146,60,0.8)', label: 'Watch' },
  { color: 'rgba(234,179,8,0.75)', label: 'Advisory' },
  { color: 'rgba(96,165,250,0.35)', label: 'Clear' },
] as const;

function GulfWatchLegend() {
  return (
    <div className="absolute bottom-8 right-3 z-10 pointer-events-none font-mono">
      <div className="tech-panel px-2.5 py-2 space-y-1 shadow-lg">
        <div className="text-[8px] text-white/30 uppercase tracking-widest pb-0.5">Gulf</div>
        {UAE_LEGEND.map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-sm flex-shrink-0 border border-white/10"
              style={{ background: color }}
            />
            <span className="text-[9px] text-white/50">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function GulfPopupCard({ popup, onClose }: { popup: GulfPopup; onClose: () => void }) {
  const isWarning = popup.alertSeverity === 'warning';
  const fmt = (iso: string) => (iso ? iso.slice(0, 16).replace('T', ' ') : '—');
  return (
    <PopupShell
      accentClass={isWarning ? 'text-red-400' : 'text-orange-400'}
      headerBgClass={isWarning ? 'bg-red-500/10' : 'bg-orange-500/10'}
      headerBorderClass={isWarning ? 'border-red-500/25' : 'border-orange-500/25'}
      dot={isWarning ? 'bg-red-400' : 'bg-orange-400'}
      label={`${popup.alertType.replace(/-/g, ' ').toUpperCase()} · ${(popup.country ?? 'UAE').toUpperCase()}`}
      onClose={onClose}
    >
      <div>
        <p className="text-white/90 font-semibold text-[12px] leading-snug">{popup.nameEn}</p>
        {popup.nameAr && (
          <p className="text-white/30 text-[9px]" dir="rtl">
            {popup.nameAr}
          </p>
        )}
      </div>
      {popup.descriptionEn && (
        <p className="text-[9px] text-white/50 leading-relaxed border-l-2 border-orange-500/30 pl-2">
          {popup.descriptionEn.slice(0, 120)}
          {popup.descriptionEn.length > 120 ? '…' : ''}
        </p>
      )}
      <Row
        label="Severity"
        value={popup.alertSeverity.toUpperCase()}
        valueClass={isWarning ? 'text-red-400' : 'text-orange-400'}
      />
      {popup.sourceCount > 0 && <Row label="Sources" value={String(popup.sourceCount)} />}
      <div className="border-t border-white/6 pt-1 space-y-1">
        <Row label="Started" value={fmt(popup.startedAt)} />
        <Row label="Expires" value={fmt(popup.expiresAt)} />
      </div>
    </PopupShell>
  );
}
