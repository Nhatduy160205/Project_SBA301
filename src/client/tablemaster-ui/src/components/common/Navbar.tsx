import React from 'react';
import { Calendar, LayoutDashboard, Shield, Compass } from 'lucide-react';

export type ActiveView = 'landing' | 'booking' | 'host' | 'waiter' | 'admin';

interface NavbarProps {
  currentView: ActiveView;
  onNavigate: (view: ActiveView) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate }) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#FBF8F3]/95 backdrop-blur-md border-b border-[#E8DFD1] transition-all">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo - LE PRIME BISTRO & LOUNGE */}
        <div
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-3.5 cursor-pointer select-none group"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C4A480] to-[#8C6A43] text-white flex items-center justify-center font-serif text-xl font-bold shadow-xs group-hover:scale-105 transition-transform border border-[#E8DFD1]">
            P
          </div>
          <div>
            <span className="font-serif text-xl font-bold tracking-wider text-[#1C1917] group-hover:text-[#8C6A43] transition-colors block leading-tight">
              LE PRIME
            </span>
            <span className="text-[9px] uppercase tracking-[0.25em] text-[#78716C] font-sans font-semibold block">
              Bistro & Lounge • Saigon
            </span>
          </div>
        </div>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#44403C]">
          <button
            onClick={() => onNavigate('landing')}
            className={`transition-all py-1.5 cursor-pointer ${
              currentView === 'landing'
                ? 'text-[#1C1917] font-semibold border-b-2 border-[#C4A480]'
                : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            Trang Chủ
          </button>
          <button
            onClick={() => onNavigate('booking')}
            className={`transition-all py-1.5 flex items-center gap-1.5 cursor-pointer ${
              currentView === 'booking'
                ? 'text-[#1C1917] font-semibold border-b-2 border-[#C4A480]'
                : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            <Calendar className="w-4 h-4 text-[#C4A480]" />
            <span>Đặt Bàn</span>
          </button>
          <button
            onClick={() => onNavigate('host')}
            className={`transition-all py-1.5 flex items-center gap-1.5 cursor-pointer ${
              currentView === 'host'
                ? 'text-[#1C1917] font-semibold border-b-2 border-[#C4A480]'
                : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            <Shield className="w-4 h-4 text-[#C4A480]" />
            <span>Thu Ngân (Staff)</span>
          </button>
          <button
            onClick={() => onNavigate('waiter')}
            className={`transition-all py-1.5 flex items-center gap-1.5 cursor-pointer ${
              currentView === 'waiter'
                ? 'text-[#1C1917] font-semibold border-b-2 border-[#C4A480]'
                : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            <span className="text-sm">📱</span>
            <span>App Phục Vụ (Tại Bàn)</span>
          </button>
          <button
            onClick={() => onNavigate('admin')}
            className={`transition-all py-1.5 flex items-center gap-1.5 cursor-pointer ${
              currentView === 'admin'
                ? 'text-[#1C1917] font-semibold border-b-2 border-[#C4A480]'
                : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-[#C4A480]" />
            <span>Dashboard</span>
          </button>
        </nav>

        {/* Right CTA Button (Camel pill button matching video) */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('booking')}
            className="btn-tan px-6 py-2.5 text-xs font-semibold shadow-2xs flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Compass className="w-4 h-4" />
            <span>Đặt Bàn Ngay</span>
          </button>
        </div>
      </div>
    </header>
  );
};
