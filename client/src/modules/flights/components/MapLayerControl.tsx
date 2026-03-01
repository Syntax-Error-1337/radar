import React from 'react';
import { useThemeStore } from '../../../ui/theme/theme.store';
import type { MapLayer } from '../../../ui/theme/theme.store';
import { Moon, Sun, Navigation, Map as MapIcon } from 'lucide-react';

export const MapLayerControl: React.FC = () => {
    const { mapLayer, setMapLayer } = useThemeStore();

    const layers: { id: MapLayer; label: string; icon: React.ReactNode; previewUrl: string }[] = [
        {
            id: 'dark',
            label: 'Dark',
            icon: <Moon size={20} className="text-gray-200" />,
            previewUrl: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
        },
        {
            id: 'light',
            label: 'Light',
            icon: <Sun size={20} className="text-gray-600" />,
            previewUrl: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
        },
        {
            id: 'street',
            label: 'Street',
            icon: <Navigation size={20} className="text-blue-500" />,
            previewUrl: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json'
        },
        {
            id: 'satellite',
            label: 'Satellite',
            icon: <MapIcon size={20} className="text-green-500" />,
            previewUrl: ''
        }
    ];

    return (
        <div className="absolute right-4 bottom-8 flex gap-3 bg-white/90 backdrop-blur-md p-2 rounded-2xl shadow-lg border border-black/5 z-10 pointer-events-auto">
            {layers.map((layer) => {
                const isSelected = mapLayer === layer.id;
                return (
                    <button
                        key={layer.id}
                        onClick={() => setMapLayer(layer.id)}
                        className={`flex flex-col items-center gap-1 group w-16`}
                    >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all overflow-hidden relative shadow-sm hover:shadow-md hover:scale-105 border-2 ${isSelected ? 'border-blue-500' : 'border-transparent'
                            }`}>
                            {/* Abstract generic map background for the buttons */}
                            <div className={`absolute inset-0 opacity-80 ${layer.id === 'dark' ? 'bg-gray-800' :
                                layer.id === 'light' ? 'bg-gray-200' :
                                    layer.id === 'street' ? 'bg-blue-100' :
                                        'bg-green-800'
                                }`}>
                                {/* Simple map lines / shapes */}
                                <div className="absolute top-0 right-0 w-8 h-8 rounded-full bg-black/10 -mr-4 -mt-4 blur-[2px]" />
                                <div className="absolute bottom-0 left-0 w-10 h-6 border-t-2 border-r-2 border-black/10 rounded-tr-lg" />
                                {layer.id === 'street' && (
                                    <>
                                        <div className="absolute top-2 left-2 w-8 h-1 bg-yellow-400/50 transform rotate-45" />
                                        <div className="absolute top-4 left-0 w-10 h-1 bg-white/50 transform -rotate-12" />
                                    </>
                                )}
                            </div>

                            {/* Icon overlay */}
                            <div className="z-10 bg-white/80 p-1 rounded-lg backdrop-blur text-gray-700 shadow-sm transition-transform group-hover:scale-110">
                                {layer.icon}
                            </div>
                        </div>
                        <span className={`text-[11px] font-medium transition-colors ${isSelected ? 'text-blue-600' : 'text-gray-500'
                            }`}>
                            {layer.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};
