import { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Compass, Wine, Music, Sparkles } from 'lucide-react';
import type { TableItem } from '../../types';

import { TableNode } from './TableNode';


interface FloorPlanCanvasProps {
  floorNumber: 1 | 2 | 3;
  tables: TableItem[];
  selectedTable: TableItem | null;
  onSelectTable: (table: TableItem) => void;
  isHeatmapMode?: boolean;
}

export const FloorPlanCanvas: React.FC<FloorPlanCanvasProps> = ({
  floorNumber,
  tables,
  selectedTable,
  onSelectTable,
  isHeatmapMode = false,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const floorTables = tables.filter((t) => t.floor === floorNumber);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.15, 1.45));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.15, 0.75));
  const handleResetZoom = () => setZoomLevel(1);

  return (
    <div className="relative w-full h-[580px] bg-[#FDFBF7] rounded-3xl border border-amber-900/15 overflow-hidden shadow-inner flex flex-col select-none">
      {/* Top Architectural Wall: Glass Panoramic View */}
      <div className="relative z-10 w-full py-2.5 px-6 bg-gradient-to-b from-sky-100/70 via-sky-50/40 to-transparent border-b border-sky-300/40 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-sky-800">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse" />
          <span className="tracking-wide uppercase font-sans">
            {floorNumber === 1
              ? '✨ Mặt Kính Toàn Cảnh Panoramic – Hướng Thẳng Phố Đi Bộ Nguyễn Huệ'
              : floorNumber === 2
              ? '🍷 Phòng Tiệc VIP Kín Đáo – Hầm Rượu Vang Bordeaux Grand Cru'
              : '🌟 Sky Lounge Rooftop – Tầm Nhìn Ôm Trọn Sài Gòn Về Đêm'}
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-sky-700/80 bg-white/70 px-2.5 py-0.5 rounded-full border border-sky-200">
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span>Vị trí Premium View</span>
        </div>
      </div>

      {/* Floating Canvas Controls */}
      <div className="absolute top-14 right-4 z-20 flex flex-col gap-1.5 bg-white/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 shadow-md">
        <button
          onClick={handleZoomIn}
          className="p-2 text-slate-600 hover:text-amber-800 hover:bg-amber-50 rounded-xl transition-colors"
          title="Phóng to sơ đồ"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 text-slate-600 hover:text-amber-800 hover:bg-amber-50 rounded-xl transition-colors"
          title="Thu nhỏ sơ đồ"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetZoom}
          className="p-2 text-slate-600 hover:text-amber-800 hover:bg-amber-50 rounded-xl transition-colors"
          title="Đặt lại góc nhìn"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Compass rose watermark */}
      <div className="absolute bottom-5 right-6 z-10 pointer-events-none opacity-15 flex flex-col items-center">
        <Compass className="w-16 h-16 text-amber-900" />
        <span className="text-[10px] font-serif font-bold text-amber-900 tracking-widest mt-1">BẮC • N</span>
      </div>

      {/* Interactive Canvas Workspace */}
      <div className="relative flex-1 w-full overflow-auto architectural-grid">
        <div
          className="relative min-w-[880px] h-[500px] transition-transform duration-300 origin-top-left p-6"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {/* Architectural Landmark 1: Left Bar & Open Kitchen Counter */}
          <div className="absolute left-4 top-16 bottom-20 w-14 rounded-2xl bg-gradient-to-r from-amber-950 to-amber-900 text-amber-100 flex flex-col items-center justify-center p-2 shadow-md border-r-2 border-amber-700/50">
            <Wine className="w-4 h-4 text-amber-400 mb-2" />
            <span
              className="text-[10px] uppercase font-bold tracking-widest text-amber-300 transform -rotate-90 whitespace-nowrap"
              style={{ writingMode: 'vertical-rl' }}
            >
              Quầy Bar & Bếp Mở
            </span>
          </div>

          {/* Architectural Landmark 2: Acoustic Stage (Floor 1) */}
          {floorNumber === 1 && (
            <div className="absolute right-6 top-16 w-20 h-28 rounded-2xl bg-amber-100/50 border border-dashed border-amber-400/80 flex flex-col items-center justify-center p-2 text-center">
              <Music className="w-5 h-5 text-amber-700 mb-1" />
              <span className="text-[10px] font-bold text-amber-900 leading-tight">Sân Khấu Acoustic</span>
              <span className="text-[8px] text-amber-700 mt-0.5">20:00 - 21:30</span>
            </div>
          )}

          {/* Architectural Landmark 3: Main Entrance & Reception at Bottom */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-8 py-2 bg-gradient-to-t from-slate-200 to-slate-100/90 rounded-t-2xl border-t-2 border-x-2 border-slate-300/80 shadow-xs flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-amber-600" />
            <span className="text-[11px] font-bold tracking-widest uppercase text-slate-700">
              Lối Vào Chính & Quầy Tiếp Đón Lễ Tân
            </span>
            <div className="w-3 h-3 rounded-full bg-amber-600" />
          </div>

          {/* Architectural Pillars / Columns for structural beauty */}
          <div className="absolute left-[330px] top-[180px] w-6 h-6 rounded-md bg-slate-300 border border-slate-400 shadow-sm flex items-center justify-center pointer-events-none">
            <span className="text-[8px] font-bold text-slate-600">C1</span>
          </div>
          <div className="absolute left-[500px] top-[180px] w-6 h-6 rounded-md bg-slate-300 border border-slate-400 shadow-sm flex items-center justify-center pointer-events-none">
            <span className="text-[8px] font-bold text-slate-600">C2</span>
          </div>

          {/* Render All Tables on Current Floor */}
          {floorTables.map((table) => (
            <TableNode
              key={table.id}
              table={table}
              isSelected={selectedTable?.id === table.id}
              onSelect={onSelectTable}
              isHeatmapMode={isHeatmapMode}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
