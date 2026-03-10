import React, { type ReactNode } from 'react';
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
  const mode = useThemeStore((s) => s.mode);

  return (
    <div className={clsx('flex flex-col h-screen w-screen overflow-hidden', `theme-${mode}`)}>
      <TopNav />
      <main className="flex-1 relative bg-intel-bg">{children}</main>
      <footer className="flex items-center justify-center gap-3 px-4 py-1 bg-black/60 border-t border-white/10 text-[10px] text-white/40 shrink-0">
        <span className="font-semibold tracking-widest text-white/60 uppercase">RADAR</span>
        <span className="text-white/20">·</span>
        <a
          href="https://github.com/Syntax-Error-1337/radar"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-white/70 transition-colors"
        >
          GitHub
        </a>
        <span className="text-white/20">·</span>
        <a
          href="https://himanshu.pro/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-white/70 transition-colors"
        >
          Portfolio
        </a>
        <span className="text-white/20">·</span>
        <a
          href="https://www.linkedin.com/in/bugbounty/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-white/70 transition-colors"
        >
          LinkedIn
        </a>
      </footer>
    </div>
  );
};
