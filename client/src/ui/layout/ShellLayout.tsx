import React, { ReactNode } from 'react';
import { TopNav } from './TopNav';
import { useThemeStore } from '../theme/theme.store';
import { clsx } from 'clsx';
import '../theme/crt.css';
import '../theme/flir.css';
import '../theme/eo.css';

interface ShellLayoutProps {
    children: ReactNode;
}

export const ShellLayout: React.FC<ShellLayoutProps> = ({ children }) => {
    const { mode } = useThemeStore();

    return (
        <div className={clsx("flex flex-col h-screen w-screen overflow-hidden", `theme-${mode}`)}>
            <TopNav />
            <main className="flex-1 relative bg-intel-bg">
                {children}
            </main>
        </div>
    );
};
