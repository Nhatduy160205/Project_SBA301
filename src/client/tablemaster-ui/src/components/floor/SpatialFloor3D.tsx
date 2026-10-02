import React, { useState, useEffect, useRef } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  Sparkles,
  Play,
  Pause,
  Compass,
  Move3d,
} from 'lucide-react';
import type { TableItem } from '../../types';

interface SpatialFloor3DProps {
  floorNumber: 1 | 2 | 3;
  tables: TableItem[];
  selectedTable: TableItem | null;
  onSelectTable: (table: TableItem) => void;
  viewMode: '3d' | '2d';
  onToggleViewMode: (mode: '3d' | '2d') => void;
}

/* --- LUXURY FRENCH BISTRO DINING CHAIR (Ghế Thonet Gỗ Uốn & Nệm Da Cao Cấp) --- */
const RealisticBistroChair: React.FC<{
  chairWoodColor: string;
  chairCushionColor: string;
  viewMode: '3d' | '2d';
  rotationDeg?: number;
  style?: React.CSSProperties;
}> = ({ chairWoodColor, chairCushionColor, viewMode, rotationDeg = 0, style = {} }) => {
  return (
    <div
      style={{
        ...style,
        transform: `${style?.transform || ''} rotate(${rotationDeg}deg)`,
        transformStyle: 'preserve-3d',
      }}
      className="absolute flex flex-col items-center justify-center pointer-events-none select-none z-10"
    >
      {/* Curved Bentwood Backrest with Spindles */}
      <div
        style={{
          backgroundColor: chairWoodColor,
          borderColor: '#2C1D11',
          boxShadow: viewMode === '3d' ? '0 4px 6px rgba(0,0,0,0.35)' : 'none',
        }}
        className="w-6 h-2 rounded-t-full border transition-all flex items-center justify-center relative overflow-hidden"
      >
        <div className="w-4 h-0.5 bg-black/25 rounded-full" />
      </div>

      {/* Upholstered Leather / Velvet Seat Cushion */}
      <div
        style={{
          backgroundColor: chairCushionColor,
          borderColor: chairWoodColor,
          boxShadow:
            viewMode === '3d'
              ? '0 4px 8px rgba(0,0,0,0.3), inset 0 2px 3px rgba(255,255,255,0.35)'
              : '0 1px 3px rgba(0,0,0,0.2)',
        }}
        className="w-5.5 h-4.5 -mt-0.5 rounded-b-md border-2 transition-all flex items-center justify-center relative"
      >
        {/* Tufted Cushion Detail */}
        <div className="w-1.5 h-1.5 rounded-full bg-black/15" />
      </div>
    </div>
  );
};

/* --- FINE DINING PLACE SETTING (Bộ Bát Đĩa Sứ Viền Vàng & Ly Rượu Vang) --- */
const FineDiningPlaceSetting: React.FC = () => (
  <div className="relative flex items-center justify-center w-7 h-7 select-none pointer-events-none">
    {/* Silverware Fork (Left) */}
    <div className="absolute left-0 top-1 w-0.5 h-5 bg-[#C0C0C0] rounded-full shadow-2xs opacity-80" />
    
    {/* Porcelain Dinner Plate with Gold Rim */}
    <div className="w-5 h-5 rounded-full bg-[#FCFAF7] border border-[#C4A480] shadow-xs flex items-center justify-center">
      {/* Inner Appetizer Plate */}
      <div className="w-3.5 h-3.5 rounded-full bg-[#FFFFFF] border border-[#E8DFD1] flex items-center justify-center">
        {/* Linen Napkin */}
        <div className="w-2 h-1 bg-[#EBE4D8] rounded-xs shadow-2xs" />
      </div>
    </div>

    {/* Silverware Knife (Right) */}
    <div className="absolute right-0 top-1 w-0.5 h-5 bg-[#D8D8D8] rounded-full shadow-2xs opacity-80" />

    {/* Crystal Wine Glass (Top Right) */}
    <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#E0F2FE]/70 border border-[#93C5FD]/60 shadow-2xs flex items-center justify-center">
      <div className="w-0.5 h-0.5 rounded-full bg-white" />
    </div>
  </div>
);

export const SpatialFloor3D: React.FC<SpatialFloor3DProps> = ({
  floorNumber,
  tables,
  selectedTable,
  onSelectTable,
  viewMode,
  onToggleViewMode,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [hoveredTableId, setHoveredTableId] = useState<string | null>(null);

  // 3D Orbit & Rotation States
  const [rotX, setRotX] = useState<number>(50);
  const [rotZ, setRotZ] = useState<number>(-16);
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const dragStartRef = useRef<{ x: number; y: number; startRotX: number; startRotZ: number }>({
    x: 0,
    y: 0,
    startRotX: 50,
    startRotZ: -16,
  });

  const animFrameRef = useRef<number | null>(null);

  const floorTables = tables.filter((t) => t.floor === floorNumber);

  // Zoom Controls
  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.15, 1.4));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.15, 0.75));
  const handleReset = () => {
    setZoomLevel(1);
    setRotX(50);
    setRotZ(-16);
    setIsAutoRotating(false);
  };

  // Preset Rotations
  const handleSetPreset = (preset: 'iso' | 'front' | 'side') => {
    setIsAutoRotating(false);
    if (preset === 'iso') {
      setRotX(50);
      setRotZ(-16);
    } else if (preset === 'front') {
      setRotX(35);
      setRotZ(0);
    } else if (preset === 'side') {
      setRotX(45);
      setRotZ(-65);
    }
  };

  // Auto-rotation loop using requestAnimationFrame
  useEffect(() => {
    if (isAutoRotating && viewMode === '3d' && !isDragging) {
      let lastTime = performance.now();
      const loop = (time: number) => {
        const delta = (time - lastTime) / 1000;
        lastTime = time;
        setRotZ((prev) => (prev + delta * 18) % 360);
        animFrameRef.current = requestAnimationFrame(loop);
      };
      animFrameRef.current = requestAnimationFrame(loop);
    }

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isAutoRotating, viewMode, isDragging]);

  // Mouse drag handlers for free 360-degree 3D Orbiting
  const handleMouseDown = (e: React.MouseEvent) => {
    if (viewMode !== '3d') return;
    if ((e.target as HTMLElement).closest('.table-node-interactive')) return;

    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startRotX: rotX,
      startRotZ: rotZ,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || viewMode !== '3d') return;

    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;

    const newRotZ = dragStartRef.current.startRotZ + deltaX * 0.45;
    const newRotX = Math.min(Math.max(dragStartRef.current.startRotX - deltaY * 0.35, 15), 75);

    setRotZ(newRotZ);
    setRotX(newRotX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile / tablet drag
  const handleTouchStart = (e: React.TouchEvent) => {
    if (viewMode !== '3d' || e.touches.length !== 1) return;
    if ((e.target as HTMLElement).closest('.table-node-interactive')) return;

    setIsDragging(true);
    dragStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      startRotX: rotX,
      startRotZ: rotZ,
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || viewMode !== '3d' || e.touches.length !== 1) return;

    const deltaX = e.touches[0].clientX - dragStartRef.current.x;
    const deltaY = e.touches[0].clientY - dragStartRef.current.y;

    const newRotZ = dragStartRef.current.startRotZ + deltaX * 0.45;
    const newRotX = Math.min(Math.max(dragStartRef.current.startRotX - deltaY * 0.35, 15), 75);

    setRotZ(newRotZ);
    setRotX(newRotX);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Luxury Fine-Dining Table Themes
  const getTableStyling = (table: TableItem) => {
    const isSelected = selectedTable?.id === table.id;

    if (isSelected) {
      return {
        tableBg: 'linear-gradient(135deg, #4A2E18 0%, #2E1B0E 100%)',
        woodGrain: 'radial-gradient(ellipse at center, rgba(196,164,128,0.2) 0%, transparent 70%)',
        tableBorder: '#E6CA9E',
        tableThickness: '#1A0E07',
        chairWood: '#4A2E18',
        chairCushion: '#C4A480',
        textColor: '#FFFFFF',
        statusDot: '#C4A480',
        statusLabel: 'Đang Chọn',
        badgeBg: 'bg-[#C4A480] text-[#1C1917] font-bold',
        glow: '0 0 30px rgba(196, 164, 128, 0.9), 0 0 10px rgba(230, 202, 158, 0.6)',
        brassPlaqueBg: 'linear-gradient(180deg, #FDF8ED 0%, #E8D3AB 100%)',
        brassPlaqueText: '#2C1D11',
        brassPlaqueBorder: '#8C6A43',
      };
    }

    if (table.status === 'AVAILABLE') {
      return {
        tableBg: 'linear-gradient(135deg, #3B2616 0%, #24160C 100%)',
        woodGrain: 'radial-gradient(ellipse at center, rgba(140,106,67,0.18) 0%, transparent 70%)',
        tableBorder: '#8C6A43',
        tableThickness: '#180E08',
        chairWood: '#3B2616',
        chairCushion: '#A68258',
        textColor: '#FAF4EB',
        statusDot: '#22C55E',
        statusLabel: 'Bàn Trống',
        badgeBg: 'bg-[#22C55E] text-white',
        glow: '0 6px 18px rgba(0, 0, 0, 0.35)',
        brassPlaqueBg: 'linear-gradient(180deg, #FAF4EB 0%, #DFCEB4 100%)',
        brassPlaqueText: '#2C1D11',
        brassPlaqueBorder: '#8C6A43',
      };
    }

    if (table.status === 'HOLDING') {
      return {
        tableBg: 'linear-gradient(135deg, #3E2817 0%, #28170B 100%)',
        woodGrain: 'radial-gradient(ellipse at center, rgba(245,158,11,0.2) 0%, transparent 70%)',
        tableBorder: '#F59E0B',
        tableThickness: '#1A0E07',
        chairWood: '#3E2817',
        chairCushion: '#D97706',
        textColor: '#FAF4EB',
        statusDot: '#F59E0B',
        statusLabel: 'Chờ Cọc',
        badgeBg: 'bg-[#D97706] text-white',
        glow: '0 6px 18px rgba(217, 119, 6, 0.4)',
        brassPlaqueBg: 'linear-gradient(180deg, #FEF3C7 0%, #FDE68A 100%)',
        brassPlaqueText: '#78350F',
        brassPlaqueBorder: '#D97706',
      };
    }

    // CONFIRMED / SEATED / OCCUPIED
    return {
      tableBg: 'linear-gradient(135deg, #2A2421 0%, #1A1715 100%)',
      woodGrain: 'radial-gradient(ellipse at center, rgba(120,113,108,0.12) 0%, transparent 70%)',
      tableBorder: '#57534E',
      tableThickness: '#12100E',
      chairWood: '#292524',
      chairCushion: '#57534E',
      textColor: '#A8A29E',
      statusDot: '#78716C',
      statusLabel: table.status === 'SEATED' ? 'Đang Dùng Bữa' : 'Đã Đặt',
      badgeBg: 'bg-[#57534E] text-white',
      glow: 'none',
      brassPlaqueBg: 'linear-gradient(180deg, #E7E5E4 0%, #D6D3D1 100%)',
      brassPlaqueText: '#44403C',
      brassPlaqueBorder: '#78716C',
    };
  };

  return (
    <div className="relative w-full bg-[#FAF7F2] rounded-3xl border border-[#E8DFD1] p-4 sm:p-6 lg:p-8 overflow-hidden shadow-xs select-none">
      {/* Top Architectural Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8DFD1] mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#C4A480] to-[#8C6A43] text-white flex items-center justify-center shadow-xs">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8C6A43]">
                {viewMode === '3d' ? '🌟 3D Spatial Interactive Orbit' : '📐 2D Architectural Blueprint'}
              </span>
              <span className="text-xs font-semibold text-[#3D7058] flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#3D7058] animate-pulse" />
                <span>Không Gian Bistro Pháp Thời Gian Thực</span>
              </span>
            </div>
            <h3 className="font-serif text-lg sm:text-xl font-bold text-[#2C221E] tracking-tight">
              {floorNumber === 1 && 'Tầng 1 — Sảnh Chính Panoramic View Nguyễn Huệ'}
              {floorNumber === 2 && 'Tầng 2 — Khối VIP Salon & Hầm Rượu Vang Grand Cru'}
              {floorNumber === 3 && 'Tầng 3 — Sky Terrace Lounge Ngắm Hoàng Hôn'}
            </h3>
          </div>
        </div>

        {/* 3D vs 2D Perspective Mode Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex bg-[#F3ECE0] p-1.5 rounded-2xl border border-[#E8DFD1] shadow-2xs">
            <button
              onClick={() => onToggleViewMode('3d')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === '3d'
                  ? 'bg-gradient-to-r from-[#C4A480] to-[#B3936F] text-white shadow-md scale-102'
                  : 'text-[#6B5E54] hover:text-[#2C221E]'
              }`}
            >
              <Sparkles className="w-4 h-4 text-white" />
              <span>🌟 Phối Cảnh 3D</span>
            </button>
            <button
              onClick={() => {
                setIsAutoRotating(false);
                onToggleViewMode('2d');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === '2d'
                  ? 'bg-gradient-to-r from-[#C4A480] to-[#B3936F] text-white shadow-md scale-102'
                  : 'text-[#6B5E54] hover:text-[#2C221E]'
              }`}
            >
              <span>📐 Mặt Bằng 2D</span>
            </button>
          </div>
        </div>
      </div>

      {/* Floating Canvas Camera Controls (Zoom, Orbit, Presets) */}
      <div className="absolute top-28 right-8 z-30 flex flex-col gap-2 bg-white/95 backdrop-blur-md p-2 rounded-2xl border border-[#E8DFD1] shadow-lg">
        {/* Auto-Rotate Toggle Button */}
        {viewMode === '3d' && (
          <button
            onClick={() => setIsAutoRotating(!isAutoRotating)}
            className={`p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
              isAutoRotating
                ? 'bg-gradient-to-r from-[#C4A480] to-[#B3936F] text-white shadow-sm animate-pulse'
                : 'text-[#6B5E54] hover:text-[#8C6A43] hover:bg-[#FAF4EB]'
            }`}
            title={isAutoRotating ? 'Dừng tự động xoay 3D' : 'Bật tự động xoay 3D (Auto-Orbit)'}
          >
            {isAutoRotating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        )}

        {/* Zoom In */}
        <button
          onClick={handleZoomIn}
          className="p-2.5 text-[#6B5E54] hover:text-[#8C6A43] hover:bg-[#FAF4EB] rounded-xl transition-colors cursor-pointer"
          title="Phóng to"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        {/* Zoom Out */}
        <button
          onClick={handleZoomOut}
          className="p-2.5 text-[#6B5E54] hover:text-[#8C6A43] hover:bg-[#FAF4EB] rounded-xl transition-colors cursor-pointer"
          title="Thu nhỏ"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        {/* Reset Camera Position */}
        <button
          onClick={handleReset}
          className="p-2.5 text-[#6B5E54] hover:text-[#8C6A43] hover:bg-[#FAF4EB] rounded-xl transition-colors cursor-pointer"
          title="Đặt lại góc nhìn mặc định"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Quick 3D Angle Preset Pills Bar (Only in 3D Mode) */}
      {viewMode === '3d' && (
        <div className="absolute top-28 left-8 z-30 flex flex-wrap items-center gap-1.5 bg-white/90 backdrop-blur-md p-1.5 rounded-2xl border border-[#E8DFD1] shadow-md">
          <div className="flex items-center gap-1 px-2 text-[10px] font-bold text-[#8C6A43] uppercase tracking-wider">
            <Compass className="w-3.5 h-3.5" />
            <span>Góc Nhìn 3D:</span>
          </div>
          <button
            onClick={() => handleSetPreset('iso')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              rotX === 50 && rotZ === -16
                ? 'bg-[#C4A480] text-white shadow-2xs font-bold'
                : 'text-[#6B5E54] hover:bg-[#FAF4EB]'
            }`}
          >
            Phối Cảnh (Isometric)
          </button>
          <button
            onClick={() => handleSetPreset('front')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              rotX === 35 && rotZ === 0
                ? 'bg-[#C4A480] text-white shadow-2xs font-bold'
                : 'text-[#6B5E54] hover:bg-[#FAF4EB]'
            }`}
          >
            Trực Diện (Front)
          </button>
          <button
            onClick={() => handleSetPreset('side')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              rotX === 45 && rotZ === -65
                ? 'bg-[#C4A480] text-white shadow-2xs font-bold'
                : 'text-[#6B5E54] hover:bg-[#FAF4EB]'
            }`}
          >
            Góc Nghiêng (Side)
          </button>
        </div>
      )}

      {/* 3D Spatial Canvas Stage Container with Mouse/Touch Drag Listeners */}
      <div
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`relative w-full h-[560px] sm:h-[620px] flex items-center justify-center overflow-hidden rounded-3xl bg-radial from-[#FDFBF7] via-[#F5EEE3] to-[#E9DFCFA0] border border-[#E8DFD1] perspective-[1300px] ${
          viewMode === '3d' ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
        }`}
      >
        {/* Ambient Top Light Beam Effect */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[380px] bg-gradient-to-b from-[#C4A480]/25 via-[#C4A480]/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* 3D Rotatable & Orbitable Floor Plane */}
        <div
          style={{
            transformStyle: 'preserve-3d',
            transform:
              viewMode === '3d'
                ? `rotateX(${rotX}deg) rotateZ(${rotZ}deg) scale(${zoomLevel * 0.94})`
                : `rotateX(0deg) rotateZ(0deg) scale(${zoomLevel})`,
            boxShadow:
              viewMode === '3d'
                ? '0 32px 0 #D1C5B4, 0 45px 70px rgba(44, 34, 30, 0.35)'
                : '0 10px 30px rgba(44, 34, 30, 0.08)',
            transition: isDragging || isAutoRotating ? 'box-shadow 0.3s ease' : 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.6s ease',
          }}
          className="relative w-full max-w-[800px] aspect-[16/10] bg-[#FAF8F5] rounded-3xl border-[3px] border-[#3D352E] p-6 select-none"
        >
          {/* Floor Parquet / Blueprint Pattern */}
          <div className="absolute inset-0 opacity-25 floor-blueprint-bg rounded-3xl pointer-events-none" />

          {/* 3D Top Panoramic Glass Wall */}
          <div
            style={{
              transformStyle: 'preserve-3d',
              transform: viewMode === '3d' ? 'translateZ(14px)' : 'none',
              transition: 'transform 0.5s ease',
            }}
            className="absolute top-2 left-6 right-6 flex items-center justify-between border-b-2 border-dashed border-[#8C6A43]/40 pb-1 pointer-events-none"
          >
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#8C6A43] uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-[#C4A480] animate-pulse" />
              <span>
                {floorNumber === 1 && 'Vách Kính Toàn Cảnh Panoramic View Phố Nguyễn Huệ'}
                {floorNumber === 2 && 'Phòng Khối Tiệc VIP & Tủ Rượu Grand Cru'}
                {floorNumber === 3 && 'Ban Công Terrace Sky Bar Ngắm Hoàng Hôn'}
              </span>
            </div>
            <span className="text-[9px] font-serif font-bold text-[#A88B68] bg-white/80 px-2 py-0.5 rounded-md border border-[#E8DFD1]">
              BISTRO FRONTAGE
            </span>
          </div>

          {/* Architectural Interior Walls & Rooms (SVG) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 800 500">
            {/* Top Right Restrooms */}
            <path d="M 640 0 L 640 130 L 800 130" fill="none" stroke="#3D352E" strokeWidth="3" strokeLinecap="round" />
            <text x="685" y="70" fontSize="10" fill="#8C6A43" fontFamily="sans-serif" fontWeight="bold">
              RESTROOMS
            </text>

            {/* Right Staircase */}
            <g transform="translate(730, 150)">
              <rect x="0" y="0" width="55" height="110" fill="#F0EDE6" stroke="#3D352E" strokeWidth="2.5" />
              {[...Array(8)].map((_, i) => (
                <line key={i} x1="0" y1={13 * (i + 1)} x2="55" y2={13 * (i + 1)} stroke="#888888" strokeWidth="1.5" />
              ))}
              <text x="10" y="100" fontSize="9" fill="#666666" fontWeight="bold">STAIRS</text>
            </g>

            {/* Bottom Bar Mixology Counter */}
            <g transform="translate(80, 420)">
              <rect x="0" y="0" width="280" height="50" rx="8" fill="#ECE5D8" stroke="#3D352E" strokeWidth="2.5" />
              <text x="75" y="30" fontSize="11" fill="#3D352E" fontFamily="serif" fontWeight="bold" letterSpacing="1">
                BAR & MIXOLOGY CELLAR
              </text>
            </g>

            {/* Reception Host Counter */}
            <g transform="translate(480, 420)">
              <rect x="0" y="0" width="160" height="50" rx="8" fill="#ECE5D8" stroke="#3D352E" strokeWidth="2.5" />
              <text x="35" y="30" fontSize="10" fill="#3D352E" fontFamily="sans-serif" fontWeight="bold">
                RECEPTION HOST
              </text>
            </g>
          </svg>

          {/* Table Items Nodes */}
          {floorTables.map((table) => {
            const isSelected = selectedTable?.id === table.id;
            const isHovered = hoveredTableId === table.id;
            const styling = getTableStyling(table);
            const isCircle = table.shape === 'circle';

            // Coordinates in percentage
            const leftPct = (table.x / 800) * 100;
            const topPct = (table.y / 500) * 100;

            // 3D Extrusion parameters
            const zHeight = viewMode === '3d'
              ? isSelected
                ? 'translateZ(36px) scale(1.08)'
                : isHovered
                ? 'translateZ(28px) scale(1.05)'
                : 'translateZ(18px)'
              : 'translateZ(0px)';

            const table3DShadow = viewMode === '3d'
              ? isSelected
                ? `0 10px 0 ${styling.tableThickness}, 0 20px 25px rgba(0, 0, 0, 0.45)`
                : isHovered
                ? `0 8px 0 ${styling.tableThickness}, 0 16px 20px rgba(0, 0, 0, 0.35)`
                : `0 6px 0 ${styling.tableThickness}, 0 10px 14px rgba(0, 0, 0, 0.25)`
              : styling.glow;

            return (
              <div
                key={table.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectTable(table);
                }}
                onMouseEnter={() => setHoveredTableId(table.id)}
                onMouseLeave={() => setHoveredTableId(null)}
                style={{
                  left: `${leftPct}%`,
                  top: `${topPct}%`,
                  transformStyle: 'preserve-3d',
                  transform: zHeight,
                  transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), filter 0.35s ease',
                }}
                className={`table-node-interactive absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer ${
                  isSelected ? 'z-40' : ''
                }`}
              >
                {/* 3D Realistic Dining Chairs Array around table */}
                <div className="relative flex items-center justify-center" style={{ transformStyle: 'preserve-3d' }}>
                  {isCircle ? (
                    // Circular Table: Radially arranged luxury French Bistro dining chairs
                    [...Array(table.capacity)].map((_, chairIdx) => {
                      const angle = (chairIdx * 2 * Math.PI) / table.capacity;
                      const r = 38;
                      const cx = Math.cos(angle) * r;
                      const cy = Math.sin(angle) * r;
                      const deg = (angle * 180) / Math.PI + 90;
                      return (
                        <RealisticBistroChair
                          key={chairIdx}
                          chairWoodColor={styling.chairWood}
                          chairCushionColor={styling.chairCushion}
                          viewMode={viewMode}
                          rotationDeg={deg}
                          style={{
                            transform: viewMode === '3d'
                              ? `translate3d(${cx}px, ${cy}px, 6px)`
                              : `translate(${cx}px, ${cy}px)`,
                          }}
                        />
                      );
                    })
                  ) : (
                    // Rectangular Table: Opposing pairs of luxury cushioned chairs
                    <>
                      {/* Top Chairs (Facing Down) */}
                      <RealisticBistroChair
                        chairWoodColor={styling.chairWood}
                        chairCushionColor={styling.chairCushion}
                        viewMode={viewMode}
                        rotationDeg={0}
                        style={{
                          left: table.capacity === 2 ? '24px' : '10px',
                          top: '-16px',
                          transform: viewMode === '3d' ? 'translateZ(6px)' : 'none',
                        }}
                      />
                      {table.capacity > 2 && (
                        <RealisticBistroChair
                          chairWoodColor={styling.chairWood}
                          chairCushionColor={styling.chairCushion}
                          viewMode={viewMode}
                          rotationDeg={0}
                          style={{
                            right: '10px',
                            top: '-16px',
                            transform: viewMode === '3d' ? 'translateZ(6px)' : 'none',
                          }}
                        />
                      )}

                      {/* Bottom Chairs (Facing Up) */}
                      <RealisticBistroChair
                        chairWoodColor={styling.chairWood}
                        chairCushionColor={styling.chairCushion}
                        viewMode={viewMode}
                        rotationDeg={180}
                        style={{
                          left: table.capacity === 2 ? '24px' : '10px',
                          bottom: '-16px',
                          transform: viewMode === '3d' ? 'translateZ(6px)' : 'none',
                        }}
                      />
                      {table.capacity > 2 && (
                        <RealisticBistroChair
                          chairWoodColor={styling.chairWood}
                          chairCushionColor={styling.chairCushion}
                          viewMode={viewMode}
                          rotationDeg={180}
                          style={{
                            right: '10px',
                            bottom: '-16px',
                            transform: viewMode === '3d' ? 'translateZ(6px)' : 'none',
                          }}
                        />
                      )}
                    </>
                  )}

                  {/* Selected Table Outer Ring Glow */}
                  {isSelected && (
                    <div
                      style={{
                        transform: viewMode === '3d' ? 'translateZ(-4px)' : 'none',
                      }}
                      className={`absolute -inset-4 ${
                        isCircle ? 'rounded-full' : 'rounded-2xl'
                      } border-2 border-[#C4A480] bg-[#C4A480]/20 shadow-[0_0_20px_rgba(196,164,128,0.6)] animate-pulse`}
                    />
                  )}

                  {/* 3D Realistic Fine-Dining Polished Walnut Tabletop Body */}
                  <div
                    className={`relative flex flex-col items-center justify-center transition-all duration-300 ${
                      isCircle ? 'w-18 h-18 rounded-full' : table.capacity === 2 ? 'w-18 h-14 rounded-2xl' : 'w-26 h-15 rounded-2xl'
                    }`}
                    style={{
                      background: styling.tableBg,
                      border: `2px solid ${styling.tableBorder}`,
                      boxShadow: table3DShadow,
                      transformStyle: 'preserve-3d',
                    }}
                  >
                    {/* Subtle Woodgrain Sheen Overlay */}
                    <div
                      style={{ background: styling.woodGrain }}
                      className={`absolute inset-0 ${isCircle ? 'rounded-full' : 'rounded-xl'} pointer-events-none`}
                    />

                    {/* Fine Dining Place Settings Layer */}
                    <div className="absolute inset-1 flex items-center justify-between px-1 pointer-events-none">
                      {isCircle ? (
                        // Circular Place Settings
                        <div className="relative w-full h-full flex items-center justify-center">
                          <FineDiningPlaceSetting />
                        </div>
                      ) : (
                        // Rectangular Place Settings (Left & Right)
                        <>
                          <FineDiningPlaceSetting />
                          {table.capacity > 2 && (
                            <FineDiningPlaceSetting />
                          )}
                        </>
                      )}
                    </div>

                    {/* Center Brass Table Number Stand Plaque (Thẻ Số Bàn Đồng Nhà Hàng) */}
                    <div
                      style={{
                        background: styling.brassPlaqueBg,
                        borderColor: styling.brassPlaqueBorder,
                        transform: viewMode === '3d' ? 'translateZ(10px)' : 'none',
                      }}
                      className="relative z-20 px-2 py-0.5 rounded-md border shadow-md flex flex-col items-center justify-center min-w-[38px]"
                    >
                      <div className="flex items-center gap-1">
                        <span
                          style={{ backgroundColor: styling.statusDot }}
                          className="w-1.5 h-1.5 rounded-full shadow-2xs"
                        />
                        <span
                          style={{ color: styling.brassPlaqueText }}
                          className="font-serif font-black text-[11px] leading-tight tracking-wider"
                        >
                          {table.code}
                        </span>
                      </div>
                      <span
                        style={{ color: styling.brassPlaqueText }}
                        className="text-[8px] font-sans font-bold opacity-80 -mt-0.5 leading-none"
                      >
                        {table.capacity} khách
                      </span>
                    </div>
                  </div>
                </div>

                {/* Floating Tooltip */}
                {isHovered && (
                  <div
                    style={{
                      transform: viewMode === '3d' ? 'translate3d(-50%, -100%, 25px)' : 'translate(-50%, -100%)',
                    }}
                    className="absolute -top-3 left-1/2 bg-[#2C221E] text-white text-[11px] font-sans font-semibold px-3 py-1.5 rounded-xl whitespace-nowrap shadow-2xl z-50 border border-[#C4A480]/50 flex items-center gap-1.5 pointer-events-none"
                  >
                    <span className="font-bold text-[#C4A480]">{table.code}</span>
                    <span>• {table.capacity} Khách</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${styling.badgeBg}`}>
                      {styling.statusLabel}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Status Legend & Visual Orbit Guide */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#E8DFD1] text-xs text-[#6B5E54]">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-[#3D7058] border border-[#2D5643] inline-block shadow-2xs" />
            <span className="font-bold text-[#2C221E]">Bàn Trống (Available)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-[#C4A480] border border-[#A6845B] inline-block shadow-2xs" />
            <span className="font-bold text-[#2C221E]">Bàn Đang Chọn</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-[#78716C] border border-[#57534E] inline-block shadow-2xs" />
            <span className="font-semibold text-[#78716C]">Đã Đặt / Đang Dùng Bữa</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-semibold text-[#8C6A43] bg-[#FBF8F3] px-3.5 py-1.5 rounded-full border border-[#E8DFD1]">
          <Move3d className="w-4 h-4 text-[#C4A480]" />
          <span>
            {viewMode === '3d'
              ? '🎮 Giữ & kéo chuột để xoay 3D 360° tự do • Bật nút Play để tự động xoay'
              : '📐 Đang ở chế độ mặt bằng 2D phẳng'}
          </span>
        </div>
      </div>
    </div>
  );
};
