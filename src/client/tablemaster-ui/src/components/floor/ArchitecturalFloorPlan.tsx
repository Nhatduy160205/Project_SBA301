import { useState } from 'react';
import type { TableItem } from '../../types';

interface ArchitecturalFloorPlanProps {
  tables: TableItem[];
  selectedTable: TableItem | null;
  onSelectTable: (table: TableItem) => void;
  interactive?: boolean;
}

export const ArchitecturalFloorPlan: React.FC<ArchitecturalFloorPlanProps> = ({
  tables,
  selectedTable,
  onSelectTable,
  interactive = true,
}) => {
  const [hoveredTableId, setHoveredTableId] = useState<string | null>(null);

  // Helper to determine chair & table color based on status and selection
  const getTableColors = (table: TableItem) => {
    const isSelected = selectedTable?.id === table.id;
    if (isSelected) {
      return {
        tableBg: '#33291E',
        chairBg: '#C4A480',
        chairBorder: '#A6845B',
        ringColor: '#C4A480',
        textColor: '#FFFFFF',
      };
    }
    if (table.status === 'AVAILABLE') {
      return {
        tableBg: '#2E2E2E',
        chairBg: '#3D7058', // Sophisticated sage green matching video
        chairBorder: '#2D5643',
        ringColor: '#3D7058',
        textColor: '#FFFFFF',
      };
    }
    if (table.status === 'HOLDING') {
      return {
        tableBg: '#3A2E1A',
        chairBg: '#D97706',
        chairBorder: '#B45309',
        ringColor: '#F59E0B',
        textColor: '#FFFFFF',
      };
    }
    // BOOKED / OCCUPIED / SEATED
    return {
      tableBg: '#262626',
      chairBg: '#52525B', // Dark charcoal/slate matching video
      chairBorder: '#3F3F46',
      ringColor: '#71717A',
      textColor: '#A1A1AA',
    };
  };

  return (
    <div className="relative w-full max-w-[940px] mx-auto bg-[#FAF8F5] rounded-3xl border-2 border-[#E8E2D8] shadow-sm p-4 sm:p-8 overflow-hidden select-none">
      {/* Outer Wall Architectural Boundary */}
      <div className="relative w-full aspect-[16/10] bg-[#FAF8F5] rounded-2xl border-[3px] border-[#333333] overflow-hidden">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 opacity-25 floor-blueprint-bg pointer-events-none" />

        {/* Interior Architectural Walls & Rooms (Matching video 00:05) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 800 500">
          {/* Top Right Restroom / Service Room Walls */}
          <path
            d="M 640 0 L 640 140 L 800 140"
            fill="none"
            stroke="#333333"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Restroom Door Opening */}
          <path
            d="M 640 90 L 640 130"
            fill="none"
            stroke="#FAF8F5"
            strokeWidth="5"
          />
          <path
            d="M 640 90 A 40 40 0 0 1 675 125"
            fill="none"
            stroke="#999999"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
          <text x="690" y="70" fontSize="10" fill="#888888" fontFamily="sans-serif" fontWeight="bold">
            RESTROOMS
          </text>

          {/* Right Staircase */}
          <g transform="translate(730, 160)">
            <rect x="0" y="0" width="55" height="120" fill="#F0EDE6" stroke="#333333" strokeWidth="2.5" />
            {[...Array(9)].map((_, i) => (
              <line key={i} x1="0" y1={12 * (i + 1)} x2="55" y2={12 * (i + 1)} stroke="#888888" strokeWidth="1.5" />
            ))}
            <text x="12" y="110" fontSize="9" fill="#666666" fontWeight="bold">STAIRS</text>
          </g>

          {/* Entrance Door Archway (Bottom Center) */}
          <path
            d="M 330 500 L 330 480 M 470 500 L 470 480"
            stroke="#333333"
            strokeWidth="3.5"
          />
          <path
            d="M 330 500 L 470 500"
            stroke="#FAF8F5"
            strokeWidth="6"
          />
          <path
            d="M 350 500 A 50 50 0 0 0 400 450"
            fill="none"
            stroke="#A8A29E"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
          <path
            d="M 450 500 A 50 50 0 0 1 400 450"
            fill="none"
            stroke="#A8A29E"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
          <text x="365" y="492" fontSize="9" fill="#78716C" fontWeight="bold" letterSpacing="0.1em">
            ENTRANCE
          </text>

          {/* Top Window Glass Wall Indicator */}
          <line x1="80" y1="0" x2="600" y2="0" stroke="#7DD3FC" strokeWidth="6" strokeOpacity="0.7" />
          <text x="240" y="18" fontSize="10" fill="#0284C7" fontWeight="600" letterSpacing="0.05em">
            PANORAMIC BOULEVARD VIEW
          </text>
        </svg>

        {/* Top-Left Curved L-Shaped Booth Sofa (Corner VIP) */}
        <div className="absolute top-6 left-8 w-44 h-40 pointer-events-none">
          {/* Curved Backrest Sofa */}
          <div className="absolute inset-0 rounded-tl-3xl rounded-tr-xl rounded-bl-xl bg-[#E2DBD0] border-2 border-[#C5BCAD] shadow-inner" />
          <div className="absolute top-2 left-2 right-2 bottom-2 rounded-tl-2xl bg-[#3D7058] border border-[#2D5643] opacity-80" />
          {/* Wood Dining Table inside booth */}
          <div className="absolute top-10 left-10 w-24 h-18 rounded-xl bg-[#2E2E2E] border-2 border-[#1C1917] flex items-center justify-center text-white shadow-md">
            <span className="text-[11px] font-bold font-serif">VIP-01</span>
          </div>
        </div>

        {/* Bottom-Right Lounge Waiting Area Sofa & Armchairs */}
        <div className="absolute bottom-6 right-20 w-44 h-24 flex items-center justify-between pointer-events-none p-2">
          {/* Lounge 2-seater sofa */}
          <div className="w-24 h-12 rounded-xl bg-[#E6DFD5] border-2 border-[#C8BEAF] shadow-xs flex items-center justify-center">
            <span className="text-[9px] font-bold text-[#78716C]">LOUNGE</span>
          </div>
          {/* Glass Coffee table */}
          <div className="w-10 h-10 rounded-full bg-[#E0F2FE] border border-[#7DD3FC] shadow-xs" />
        </div>

        {/* Interactive Dining Tables mapped across floor (Matching video 00:05 layout) */}
        {tables.slice(0, 8).map((table, index) => {
          // Precise coordinate layout matching the video screenshot
          const positions = [
            { x: 310, y: 55, shape: 'circle', cap: 6 }, // Top Center Round
            { x: 490, y: 55, shape: 'circle', cap: 8 }, // Top Right Round
            { x: 190, y: 190, shape: 'rect', cap: 4 },  // Mid Left Rect
            { x: 340, y: 190, shape: 'rect', cap: 4 },  // Mid Center Rect
            { x: 490, y: 190, shape: 'rect', cap: 4 },  // Mid Right Rect
            { x: 190, y: 320, shape: 'circle', cap: 6 },// Bottom Left Round
            { x: 340, y: 320, shape: 'circle', cap: 6 },// Bottom Center Round
            { x: 490, y: 320, shape: 'circle', cap: 6 },// Bottom Right Round
          ];

          const pos = positions[index] || { x: 300, y: 200, shape: 'rect', cap: 4 };
          const colors = getTableColors(table);
          const isSelected = selectedTable?.id === table.id;
          const isHovered = hoveredTableId === table.id;
          const isCircle = pos.shape === 'circle';

          return (
            <div
              key={table.id}
              onClick={() => interactive && onSelectTable(table)}
              onMouseEnter={() => setHoveredTableId(table.id)}
              onMouseLeave={() => setHoveredTableId(null)}
              className={`absolute cursor-pointer transition-transform duration-200 ${
                isHovered ? 'scale-105' : ''
              } ${isSelected ? 'scale-105 z-20' : 'z-10'}`}
              style={{
                left: `${(pos.x / 800) * 100}%`,
                top: `${(pos.y / 500) * 100}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {/* Table Container */}
              <div className="relative flex items-center justify-center">
                {/* Radial chairs around table */}
                {isCircle ? (
                  // Round table chairs
                  [...Array(pos.cap)].map((_, chairIdx) => {
                    const angle = (chairIdx * 2 * Math.PI) / pos.cap;
                    const r = 32;
                    const cx = Math.cos(angle) * r;
                    const cy = Math.sin(angle) * r;
                    return (
                      <div
                        key={chairIdx}
                        className="absolute w-5 h-5 rounded-full border shadow-xs transition-colors duration-300"
                        style={{
                          backgroundColor: colors.chairBg,
                          borderColor: colors.chairBorder,
                          transform: `translate(${cx}px, ${cy}px)`,
                        }}
                      />
                    );
                  })
                ) : (
                  // Rectangular table chairs
                  <>
                    <div
                      className="absolute -top-3 w-5 h-5 rounded-full border shadow-xs"
                      style={{ backgroundColor: colors.chairBg, borderColor: colors.chairBorder, left: '10px' }}
                    />
                    <div
                      className="absolute -top-3 w-5 h-5 rounded-full border shadow-xs"
                      style={{ backgroundColor: colors.chairBg, borderColor: colors.chairBorder, right: '10px' }}
                    />
                    <div
                      className="absolute -bottom-3 w-5 h-5 rounded-full border shadow-xs"
                      style={{ backgroundColor: colors.chairBg, borderColor: colors.chairBorder, left: '10px' }}
                    />
                    <div
                      className="absolute -bottom-3 w-5 h-5 rounded-full border shadow-xs"
                      style={{ backgroundColor: colors.chairBg, borderColor: colors.chairBorder, right: '10px' }}
                    />
                  </>
                )}

                {/* Selected Outer Ring */}
                {isSelected && (
                  <div
                    className={`absolute -inset-2.5 ${
                      isCircle ? 'rounded-full' : 'rounded-2xl'
                    } border-2 border-[#C4A480] bg-[#C4A480]/15 animate-pulse`}
                  />
                )}

                {/* Tabletop Body */}
                <div
                  className={`relative flex items-center justify-center shadow-md transition-all duration-200 ${
                    isCircle
                      ? 'w-14 h-14 rounded-full'
                      : 'w-18 h-12 rounded-xl'
                  }`}
                  style={{
                    backgroundColor: colors.tableBg,
                    border: isSelected ? '2px solid #C4A480' : '2px solid #1C1917',
                  }}
                >
                  <span
                    className="font-serif font-bold text-xs tracking-wider"
                    style={{ color: colors.textColor }}
                  >
                    {table.code}
                  </span>
                </div>
              </div>

              {/* Status Chip Tooltip */}
              {isHovered && (
                <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-[#1C1917] text-white text-[10px] font-sans font-semibold px-2.5 py-1 rounded-full whitespace-nowrap shadow-lg z-30">
                  Bàn {table.code} • {table.capacity} khách • {table.status}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Status Legend Strip (Exactly matching video 00:05 bottom legend) */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-[#44403C]">
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-[#3D7058] border border-[#2D5643] inline-block" />
          <span className="font-semibold text-slate-800">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-[#52525B] border border-[#3F3F46] inline-block" />
          <span className="font-semibold text-slate-800">Booked</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-[#C4A480] border border-[#A6845B] inline-block" />
          <span className="font-semibold text-slate-800">Selected</span>
        </div>
      </div>
    </div>
  );
};
