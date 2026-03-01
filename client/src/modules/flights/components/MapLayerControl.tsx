import React, { useState, useRef, useEffect } from 'react';
import { useThemeStore } from '../../../ui/theme/theme.store';
import type { MapLayer } from '../../../ui/theme/theme.store';
import { Layers, X, HelpCircle } from 'lucide-react';

export const MapLayerControl: React.FC = () => {
    const { mapLayer, setMapLayer, mapProjection, setMapProjection } = useThemeStore();
    const [isOpen, setIsOpen] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);

    // Close when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const mapTypes: { id: MapLayer; label: string; bgClass: string }[] = [
        {
            id: 'street',
            label: 'Default',
            bgClass: 'bg-[#CBE4EE]',
        },
        {
            id: 'satellite',
            label: 'Satellite',
            bgClass: 'bg-[#5B6D55]',
        },
        {
            id: 'light',
            label: 'Light',
            bgClass: 'bg-[#EDEDED]',
        },
        {
            id: 'dark',
            label: 'Dark',
            bgClass: 'bg-[#2E3136]',
        },
    ];

    return (
        <div className="absolute right-4 bottom-8 flex flex-col items-end gap-2 z-20 pointer-events-auto" ref={popoverRef}>

            {/* Popover Menu */}
            {isOpen && (
                <div className="bg-white rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.15)] w-[320px] overflow-hidden text-[#3C4043] animate-in fade-in zoom-in-95 duration-100 mb-2">

                    {/* Header */}
                    <div className="flex justify-between items-center px-4 py-3 pb-2 border-b border-gray-100">
                        <h2 className="font-semibold text-[15px]">Map details</h2>
                        <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-black hover:bg-gray-100 p-1 rounded-full transition-colors">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Content Body */}
                    <div className="p-4 space-y-5">

                        {/* Map Type Grid */}
                        <div>
                            <h3 className="text-sm font-semibold mb-3">Map type</h3>
                            <div className="grid grid-cols-4 gap-2">
                                {mapTypes.map((type) => {
                                    const isSelected = mapLayer === type.id;
                                    return (
                                        <button
                                            key={type.id}
                                            onClick={() => setMapLayer(type.id)}
                                            className="flex flex-col items-center gap-1.5 focus:outline-none group"
                                        >
                                            <div className={`w-[52px] h-[52px] rounded-xl flex items-center justify-center transition-all overflow-hidden relative border-[2.5px] ${isSelected ? 'border-[#1A73E8]' : 'border-transparent hover:brightness-95'
                                                }`}>

                                                {/* Abstract representation of map types since we don't have actual thumbnails */}
                                                <div className={`absolute inset-0 ${type.bgClass}`}>
                                                    {type.id === 'street' && (
                                                        <>
                                                            <div className="absolute top-2 left-2 w-8 h-1 bg-[#F9E2A0] transform rotate-45" />
                                                            <div className="absolute top-6 left-0 w-10 h-1 bg-white transform -rotate-12" />
                                                            <div className="absolute bottom-1 right-1 w-4 h-4 bg-[#B9D8B6] rounded-sm" />
                                                        </>
                                                    )}
                                                    {type.id === 'satellite' && (
                                                        <>
                                                            <div className="absolute inset-0 bg-black/10" />
                                                            <div className="absolute top-0 right-0 w-8 h-8 rounded-full bg-[#4A5D44] blur-[2px]" />
                                                            <div className="absolute bottom-0 left-2 w-6 h-6 rounded-full bg-[#384A33] blur-[1px]" />
                                                        </>
                                                    )}
                                                    {type.id === 'dark' && (
                                                        <>
                                                            <div className="absolute top-3 left-1 w-8 h-0.5 bg-gray-600 transform rotate-12" />
                                                            <div className="absolute bottom-2 right-1 w-6 h-0.5 bg-gray-500 transform -rotate-45" />
                                                        </>
                                                    )}
                                                    {type.id === 'light' && (
                                                        <>
                                                            <div className="absolute top-3 left-1 w-8 h-1 bg-white transform rotate-12" />
                                                            <div className="absolute bottom-2 right-1 w-6 h-1 bg-white transform -rotate-45" />
                                                        </>
                                                    )}

                                                </div>
                                            </div>
                                            <span className={`text-[11px] font-medium transition-colors ${isSelected ? 'text-[#1A73E8]' : 'text-[#70757A]'
                                                }`}>
                                                {type.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                    </div>

                    {/* Footer Options */}
                    <div className="border-t border-gray-100 bg-[#F8F9FA] px-4 py-3 flex items-center gap-4 text-[13px] text-[#3C4043] font-medium">

                        {/* Globe Toggle */}
                        <label className="flex items-center gap-2 cursor-pointer select-none group">
                            <div className="relative flex items-center justify-center">
                                <input
                                    type="checkbox"
                                    className="peer appearance-none w-4 h-4 border-2 border-[#70757A] rounded-sm bg-white checked:bg-[#00897B] checked:border-[#00897B] transition-colors cursor-pointer"
                                    checked={mapProjection === 'globe'}
                                    onChange={(e) => setMapProjection(e.target.checked ? 'globe' : 'mercator')}
                                />
                                <div className="absolute pointer-events-none opacity-0 peer-checked:opacity-100 text-white">
                                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                            </div>
                            Globe view
                            <HelpCircle size={14} className="text-[#70757A] ml-0.5" />
                        </label>

                    </div>
                </div>
            )}

            {/* Main Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle map layer options"
                aria-expanded={isOpen}
                className={`bg-white text-gray-700 p-2.5 rounded-sm shadow-md border hover:bg-gray-50 hover:text-black transition-all ${isOpen ? 'bg-gray-100 border-gray-300' : 'border-gray-200'
                    }`}
                title="Map Layers"
            >
                <Layers size={22} className={isOpen ? 'text-[#1A73E8]' : ''} />
            </button>
        </div>
    );
};
