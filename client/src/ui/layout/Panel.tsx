import React, { type ReactNode } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface PanelProps {
    children: ReactNode;
    className?: string;
    title?: string;
}

export const Panel: React.FC<PanelProps> = ({ children, className, title }) => {
    return (
        <div className={twMerge(clsx("bg-intel-bg/80 border border-intel-panel backdrop-blur-md rounded pointer-events-auto flex flex-col shadow-lg shadow-black/50", className))}>
            {title && (
                <div className="px-3 py-2 border-b border-intel-panel bg-intel-panel/50 text-intel-text-light text-[10px] font-bold uppercase tracking-widest">
                    {title}
                </div>
            )}
            <div className="p-3 flex-1 overflow-auto custom-scrollbar">
                {children}
            </div>
        </div>
    );
};
