import { useRef, useEffect, useCallback, useState } from 'react';
import Map, { NavigationControl, Popup } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { MapRef } from 'react-map-gl/maplibre';
import type { MapLayerMouseEvent, ProjectionSpecification } from 'maplibre-gl';
import { useThemeStore } from '../../../ui/theme/theme.store';
import { SATELLITE_STYLE, DARK_STYLE } from '../../../lib/mapStyles';
import { useOsintStore } from '../../osint/osint.store';
import { GPSJammingLayer } from './GPSJammingLayer';
import { RocketAlertLayer, ROCKET_ALERT_LAYER_IDS } from './RocketAlertLayer';
import { useGPSJammingStore } from '../gpsJamming.store';

const INITIAL_VIEW_STATE = {
  longitude: 0,
  latitude: 20,
  zoom: 1.5,
};

interface AlertPopup {
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

const ALERT_TYPE_LABEL: Record<number, string> = { 1: 'ROCKET', 2: 'UAV' };

export function MonitorMap() {
  const mapRef = useRef<MapRef>(null);
  const { mapLayer, mapProjection } = useThemeStore();
  const { setCurrentRegion } = useOsintStore();
  const gpsJammingEnabled = useGPSJammingStore((s) => s.enabled);
  const [alertPopup, setAlertPopup] = useState<AlertPopup | null>(null);

  const activeMapStyle = mapLayer === 'satellite' ? SATELLITE_STYLE : DARK_STYLE;

  const onClick = useCallback(
    (e: MapLayerMouseEvent) => {
      // Check if we clicked an alert marker first
      const feature = e.features?.[0];
      if (feature && ROCKET_ALERT_LAYER_IDS.includes(feature.layer.id)) {
        const p = feature.properties as AlertPopup;
        setAlertPopup({
          lng: (feature.geometry as GeoJSON.Point).coordinates[0],
          lat: (feature.geometry as GeoJSON.Point).coordinates[1],
          nameEn: p.nameEn,
          nameHe: p.nameHe,
          area: p.area,
          areaHe: p.areaHe,
          alertTypeId: p.alertTypeId,
          countdownSec: p.countdownSec,
          timeStamp: p.timeStamp,
        });
        return;
      }
      // Otherwise set OSINT region
      setAlertPopup(null);
      setCurrentRegion(e.lngLat.lat, e.lngLat.lng);
    },
    [setCurrentRegion],
  );

  // Force map resize on mount to fix MapLibre zero-dimension rendering bug in flex/grid layouts
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.resize();
      }
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
        interactiveLayerIds={ROCKET_ALERT_LAYER_IDS}
        projection={
          mapProjection === 'globe'
            ? ({ type: 'globe' } as ProjectionSpecification)
            : ({ type: 'mercator' } as ProjectionSpecification)
        }
        doubleClickZoom={mapProjection !== 'globe'}
        style={{ width: '100%', height: '100%' }}
      >
        <NavigationControl position="top-right" showCompass={true} visualizePitch={true} />

        {/* GPS Jamming Layer */}
        {gpsJammingEnabled && <GPSJammingLayer />}

        {/* Rocket / UAV Alert Markers */}
        <RocketAlertLayer />

        {/* Alert detail popup */}
        {alertPopup && (
          <Popup
            longitude={alertPopup.lng}
            latitude={alertPopup.lat}
            anchor="bottom"
            offset={16}
            closeButton={false}
            onClose={() => setAlertPopup(null)}
            className="rocket-alert-popup"
          >
            <div
              className="font-mono bg-[#070a0f] border border-red-500/35 rounded-sm min-w-[200px] max-w-[240px] shadow-[0_0_24px_rgba(239,68,68,0.2)] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top bar */}
              <div
                className={`flex items-center justify-between px-2.5 py-1.5 border-b ${
                  alertPopup.alertTypeId === 2
                    ? 'bg-orange-500/12 border-orange-500/25'
                    : 'bg-red-500/12 border-red-500/25'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                      alertPopup.alertTypeId === 2 ? 'bg-orange-400' : 'bg-red-400'
                    }`}
                  />
                  <span
                    className={`text-[9px] font-bold uppercase tracking-[0.15em] ${
                      alertPopup.alertTypeId === 2 ? 'text-orange-400' : 'text-red-400'
                    }`}
                  >
                    {ALERT_TYPE_LABEL[alertPopup.alertTypeId] ?? `TYPE ${alertPopup.alertTypeId}`}{' '}
                    ALERT
                  </span>
                </div>
                <button
                  onClick={() => setAlertPopup(null)}
                  className="text-white/25 hover:text-white/60 transition-colors text-[10px] leading-none ml-2"
                >
                  ✕
                </button>
              </div>

              <div className="px-2.5 py-2 space-y-2">
                {/* Location name */}
                <div>
                  <p className="text-white/90 font-semibold text-[12px] leading-snug">
                    {alertPopup.nameEn || alertPopup.nameHe}
                  </p>
                  {alertPopup.nameEn && alertPopup.nameHe && (
                    <p className="text-white/30 text-[9px] mt-0.5" dir="rtl">
                      {alertPopup.nameHe}
                    </p>
                  )}
                </div>

                {/* Area */}
                {alertPopup.area && (
                  <div className="flex items-center justify-between text-[9px]">
                    <span className="text-white/35 uppercase tracking-wider">Area</span>
                    <div className="text-right">
                      <span className="text-white/65">{alertPopup.area}</span>
                      {alertPopup.areaHe && alertPopup.areaHe !== alertPopup.area && (
                        <span className="text-white/25 ml-1.5" dir="rtl">
                          {alertPopup.areaHe}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Countdown */}
                {alertPopup.countdownSec > 0 && (
                  <div className="border border-amber-500/25 bg-amber-500/8 px-2 py-1.5 flex items-center justify-between">
                    <span className="text-[8px] text-amber-400/70 uppercase tracking-wider">
                      Time to shelter
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-amber-400 animate-pulse inline-block" />
                      <span className="text-[11px] font-bold text-amber-300 tabular-nums">
                        {alertPopup.countdownSec}s
                      </span>
                    </div>
                  </div>
                )}

                {/* Coordinates + time */}
                <div className="border-t border-white/6 pt-1.5 space-y-1">
                  <div className="flex items-center justify-between text-[8px]">
                    <span className="text-white/25 uppercase tracking-wider">Coordinates</span>
                    <span className="text-white/40 tabular-nums">
                      {alertPopup.lat.toFixed(4)}°, {alertPopup.lng.toFixed(4)}°
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[8px]">
                    <span className="text-white/25 uppercase tracking-wider">Time (IL)</span>
                    <span className="text-white/40 tabular-nums">
                      {alertPopup.timeStamp.slice(0, 16).replace('T', ' ')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Popup>
        )}
      </Map>

      {/* Map Label */}
      <div className="absolute top-3 left-3 pointer-events-none z-10 tech-panel px-3 py-1.5 shadow-lg">
        <div className="flex items-center gap-2 text-[11px] font-mono font-bold tracking-wider text-intel-text-light uppercase">
          <span className="w-1.5 h-1.5 bg-intel-accent rounded-full animate-pulse shadow-[0_0_6px_var(--color-intel-accent)]"></span>
          Global Monitor
        </div>
      </div>
    </div>
  );
}
