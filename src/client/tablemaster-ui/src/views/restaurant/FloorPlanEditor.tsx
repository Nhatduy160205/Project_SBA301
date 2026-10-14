import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Edit3,
  X,
  Layers,
  Sparkles,
  Eye,
  EyeOff,
  Users,
  Search,
  Coffee,
  CheckCircle2,
  AlertCircle,
  LayoutGrid,
  Maximize2,
} from 'lucide-react';
import type { FloorPlan, Table } from '../../services/restaurantApi';
import { restaurantApi } from '../../services/restaurantApi';

interface FloorPlanEditorProps {
  floorPlans: FloorPlan[];
  selectedFloorId: string;
  onSelectFloorId: (id: string) => void;
  onRefreshData: () => Promise<void>;
  onShowToast: (message: string, type?: 'success' | 'error') => void;
}

export const FloorPlanEditor: React.FC<FloorPlanEditorProps> = ({
  floorPlans,
  selectedFloorId,
  onSelectFloorId,
  onRefreshData,
  onShowToast,
}) => {
  const currentFloor = floorPlans.find((f) => f.id === selectedFloorId) || floorPlans[0];
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [selectedZone, setSelectedZone] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Table Modal
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [tableFormData, setTableFormData] = useState({
    tableCode: '',
    zoneType: 'STANDARD',
    minCapacity: 2,
    maxCapacity: 4,
    customDeposit: 200000,
    shape: 'RECT' as 'RECT' | 'SQUARE' | 'CIRCLE',
    width: 90,
    height: 80,
    isActive: true,
  });

  useEffect(() => {
    if (currentFloor) {
      setTables(currentFloor.tables || []);
      setSelectedTable(null);
    }
  }, [currentFloor]);

  // Toggle publish
  const handleTogglePublish = async () => {
    if (!currentFloor) return;
    try {
      await restaurantApi.toggleFloorPlanPublish(currentFloor.id);
      onShowToast(`Đã ${currentFloor.isPublished ? 'thu hồi xuất bản' : 'xuất bản'} sơ đồ tầng!`, 'success');
      await onRefreshData();
    } catch (err: any) {
      onShowToast(err.message || 'Lỗi đổi trạng thái xuất bản', 'error');
    }
  };

  // Open Add Table Modal
  const openAddTableModal = () => {
    setModalMode('create');
    setTableFormData({
      tableCode: `T-${(tables.length + 1).toString().padStart(2, '0')}`,
      zoneType: selectedZone !== 'ALL' ? selectedZone : 'STANDARD',
      minCapacity: 2,
      maxCapacity: 4,
      customDeposit: 200000,
      shape: 'RECT',
      width: 90,
      height: 80,
      isActive: true,
    });
    setIsTableModalOpen(true);
  };

  // Open Edit Table Modal
  const openEditTableModal = (table: Table) => {
    setSelectedTable(table);
    setModalMode('edit');
    setTableFormData({
      tableCode: table.tableCode,
      zoneType: table.zoneType || 'STANDARD',
      minCapacity: table.minCapacity,
      maxCapacity: table.maxCapacity,
      customDeposit: table.customDeposit || 200000,
      shape: table.shape || 'RECT',
      width: table.width || 90,
      height: table.height || 80,
      isActive: table.isActive,
    });
    setIsTableModalOpen(true);
  };

  // Submit Table Form
  const handleSubmitTableForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFloor) return;

    if (tableFormData.minCapacity > tableFormData.maxCapacity) {
      onShowToast('Sức chứa tối thiểu không thể lớn hơn sức chứa tối đa', 'error');
      return;
    }

    try {
      if (modalMode === 'create') {
        const newTable = await restaurantApi.createTable({
          floorPlanId: currentFloor.id,
          tableCode: tableFormData.tableCode.trim(),
          zoneType: tableFormData.zoneType,
          minCapacity: tableFormData.minCapacity,
          maxCapacity: tableFormData.maxCapacity,
          customDeposit: tableFormData.customDeposit,
          shape: tableFormData.shape,
          width: tableFormData.width,
          height: tableFormData.height,
          posX: 100,
          posY: 100,
          isActive: tableFormData.isActive,
        });
        setTables((prev) => [...prev, newTable]);
        setSelectedTable(newTable);
        onShowToast(`Đã thêm bàn ${newTable.tableCode} thành công!`, 'success');
      } else if (selectedTable) {
        const updated = await restaurantApi.updateTable(selectedTable.id, {
          floorPlanId: currentFloor.id,
          tableCode: tableFormData.tableCode.trim(),
          zoneType: tableFormData.zoneType,
          minCapacity: tableFormData.minCapacity,
          maxCapacity: tableFormData.maxCapacity,
          customDeposit: tableFormData.customDeposit,
          shape: tableFormData.shape,
          width: tableFormData.width,
          height: tableFormData.height,
          posX: selectedTable.posX,
          posY: selectedTable.posY,
          isActive: tableFormData.isActive,
        });
        setTables((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        setSelectedTable(updated);
        onShowToast(`Cập nhật thông tin bàn ${updated.tableCode} thành công!`, 'success');
      }
      setIsTableModalOpen(false);
      await onRefreshData();
    } catch (err: any) {
      onShowToast(err.message || 'Lỗi khi lưu thông tin bàn', 'error');
    }
  };

  // Delete Table
  const handleDeleteTable = async (tableId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bàn này khỏi hệ thống?')) return;
    try {
      await restaurantApi.deleteTable(tableId);
      setTables((prev) => prev.filter((t) => t.id !== tableId));
      if (selectedTable?.id === tableId) setSelectedTable(null);
      onShowToast('Đã xóa bàn thành công', 'success');
      await onRefreshData();
    } catch (err: any) {
      onShowToast(err.message || 'Lỗi khi xóa bàn', 'error');
    }
  };

  // Toggle Table Active
  const handleToggleTableActive = async (tableId: string) => {
    try {
      const updated = await restaurantApi.toggleTableActive(tableId);
      setTables((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      if (selectedTable?.id === updated.id) setSelectedTable(updated);
      onShowToast(`Đã ${updated.isActive ? 'kích hoạt' : 'ngừng hoạt động'} bàn ${updated.tableCode}`, 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Lỗi thay đổi trạng thái bàn', 'error');
    }
  };

  // Filtered tables by Zone and Search query
  const filteredTables = tables.filter((table) => {
    const matchZone = selectedZone === 'ALL' || table.zoneType === selectedZone;
    const matchQuery =
      searchQuery.trim() === '' ||
      table.tableCode.toLowerCase().includes(searchQuery.toLowerCase().trim());
    return matchZone && matchQuery;
  });

  // Zone metadata helper
  const getZoneBadge = (zone: string) => {
    switch (zone) {
      case 'VIP':
        return {
          label: 'Phòng VIP',
          badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
          boxBorder: 'border-amber-400/80 hover:border-amber-500',
          headerBg: 'bg-amber-50/80 text-amber-950',
        };
      case 'WINDOW_VIEW':
        return {
          label: 'View Mặt Kính',
          badgeClass: 'bg-sky-100 text-sky-900 border-sky-300',
          boxBorder: 'border-sky-400/80 hover:border-sky-500',
          headerBg: 'bg-sky-50/80 text-sky-950',
        };
      case 'OUTDOOR':
        return {
          label: 'Ngoài Trời',
          badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          boxBorder: 'border-emerald-400/80 hover:border-emerald-500',
          headerBg: 'bg-emerald-50/80 text-emerald-950',
        };
      case 'BAR_SIDE':
        return {
          label: 'Cạnh Quầy Bar',
          badgeClass: 'bg-purple-100 text-purple-900 border-purple-300',
          boxBorder: 'border-purple-400/80 hover:border-purple-500',
          headerBg: 'bg-purple-50/80 text-purple-950',
        };
      default:
        return {
          label: 'Tiêu Chuẩn',
          badgeClass: 'bg-[#FAF4EB] text-[#8C6A43] border-[#E0D7C9]',
          boxBorder: 'border-[#E8DFD1] hover:border-[#C4A480]',
          headerBg: 'bg-[#FAF7F2] text-[#2C221E]',
        };
    }
  };

  // Stats calculation
  const totalTables = tables.length;
  const activeTables = tables.filter((t) => t.isActive).length;
  const vipTables = tables.filter((t) => t.zoneType === 'VIP').length;
  const totalMaxCapacity = tables.reduce((acc, t) => acc + (t.maxCapacity || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Controls Toolbar */}
      <div className="bg-white border border-[#EBE5DC] rounded-3xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Floor Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#8C6A43] uppercase tracking-wider flex items-center gap-1.5 mr-2">
            <Layers className="w-4 h-4" />
            <span>Mặt Bằng Tầng:</span>
          </span>
          <div className="flex items-center gap-1.5 bg-[#FAF7F2] p-1 rounded-2xl border border-[#E0D7C9]/70">
            {floorPlans.map((floor) => (
              <button
                key={floor.id}
                onClick={() => onSelectFloorId(floor.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentFloor?.id === floor.id
                    ? 'bg-gradient-to-r from-[#C4A480] to-[#B3936F] text-white shadow-xs'
                    : 'text-[#6B5E54] hover:text-[#1C1917]'
                }`}
              >
                {floor.name}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Add Table Button */}
          <button
            onClick={openAddTableModal}
            className="btn-tan px-4 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>+ Thêm Box Bàn Mới</span>
          </button>

          {/* Publish / Unpublish */}
          <button
            onClick={handleTogglePublish}
            className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer border transition-colors ${
              currentFloor?.isPublished
                ? 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]'
                : 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]'
            }`}
          >
            {currentFloor?.isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span>{currentFloor?.isPublished ? 'Đang Xuất Bản' : 'Bản Nháp'}</span>
          </button>
        </div>
      </div>

      {/* Quick KPI Stats Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-[#EBE5DC] rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] font-bold text-[#78716C] uppercase tracking-wider block">Tổng Số Bàn</span>
          <div className="text-xl sm:text-2xl font-serif font-bold text-[#1C1917] mt-1">{totalTables} Box</div>
          <span className="text-[10px] text-[#8C6A43] font-semibold mt-0.5 block">{currentFloor?.name}</span>
        </div>

        <div className="bg-white border border-[#EBE5DC] rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] font-bold text-[#78716C] uppercase tracking-wider block">Bàn Đang Hoạt Động</span>
          <div className="text-xl sm:text-2xl font-serif font-bold text-[#3D7058] mt-1">{activeTables} Box</div>
          <span className="text-[10px] text-[#3D7058] font-semibold mt-0.5 block">Sẵn sàng phục vụ</span>
        </div>

        <div className="bg-white border border-[#EBE5DC] rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] font-bold text-[#78716C] uppercase tracking-wider block">Khu Vực VIP</span>
          <div className="text-xl sm:text-2xl font-serif font-bold text-amber-700 mt-1">{vipTables} Box</div>
          <span className="text-[10px] text-amber-600 font-semibold mt-0.5 block">Salon tiệc riêng tư</span>
        </div>

        <div className="bg-white border border-[#EBE5DC] rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] font-bold text-[#78716C] uppercase tracking-wider block">Công Suất Chứa Tối Đa</span>
          <div className="text-xl sm:text-2xl font-serif font-bold text-[#8C6A43] mt-1">{totalMaxCapacity} Khách</div>
          <span className="text-[10px] text-[#78716C] font-semibold mt-0.5 block">Tổng ghế ngồi</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#EBE5DC] rounded-2xl p-3 sm:p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Zone Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-[#78716C] mr-1 hidden sm:inline">Khu Vực:</span>
          {[
            { id: 'ALL', label: 'Tất Cả' },
            { id: 'STANDARD', label: 'Tiêu Chuẩn' },
            { id: 'VIP', label: 'Phòng VIP' },
            { id: 'WINDOW_VIEW', label: 'View Mặt Kính' },
            { id: 'OUTDOOR', label: 'Ngoài Trời' },
            { id: 'BAR_SIDE', label: 'Cạnh Bar' },
          ].map((z) => (
            <button
              key={z.id}
              onClick={() => setSelectedZone(z.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selectedZone === z.id
                  ? 'bg-[#2C221E] text-white font-bold shadow-2xs'
                  : 'bg-[#FAF7F2] text-[#6B5E54] hover:bg-[#F2ECE1] hover:text-[#1C1917]'
              }`}
            >
              {z.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-56">
          <Search className="w-3.5 h-3.5 text-[#78716C] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo mã box..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-[#E0D7C9] bg-[#FAF7F2] focus:outline-hidden focus:border-[#C4A480]"
          />
        </div>
      </div>

      {/* Main Table Box Workspace (Grid + Detail Panel) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Table Boxes Grid (Span 3 Cols) */}
        <div className="lg:col-span-3 bg-white border border-[#EBE5DC] rounded-3xl p-5 sm:p-6 shadow-sm min-h-[500px]">
          <div className="flex items-center justify-between pb-4 border-b border-[#EBE5DC] mb-5">
            <div className="flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-[#8C6A43]" />
              <h3 className="font-serif text-lg font-bold text-[#1C1917]">
                Danh Sách Box Bàn — {currentFloor?.name}
              </h3>
              <span className="text-xs text-[#78716C] font-semibold bg-[#FAF7F2] px-2.5 py-0.5 rounded-full border border-[#E0D7C9]">
                {filteredTables.length} / {tables.length} Box
              </span>
            </div>
          </div>

          {filteredTables.length === 0 ? (
            <div className="py-20 text-center text-[#78716C] space-y-3">
              <Coffee className="w-10 h-10 text-[#C4A480]/60 mx-auto" />
              <p className="text-sm font-semibold">Chưa có box bàn nào trong khu vực này.</p>
              <button
                onClick={openAddTableModal}
                className="btn-tan px-4 py-2 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm Box Bàn Mới Ngay</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredTables.map((table) => {
                const isSelected = selectedTable?.id === table.id;
                const zoneInfo = getZoneBadge(table.zoneType);

                return (
                  <div
                    key={table.id}
                    onClick={() => setSelectedTable(table)}
                    className={`rounded-2xl border-2 transition-all p-4.5 cursor-pointer flex flex-col justify-between select-none relative group ${
                      isSelected
                        ? 'border-[#C4A480] bg-[#FAF6F0] ring-4 ring-[#C4A480]/20 shadow-md scale-[1.02]'
                        : `bg-white ${zoneInfo.boxBorder} shadow-2xs hover:shadow-md`
                    } ${!table.isActive ? 'opacity-70 bg-gray-50' : ''}`}
                  >
                    {/* Top Row: Code & Active Status */}
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-[#EBE5DC]/70">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FAF7F2] to-[#EFE7DC] border border-[#E0D7C9] text-[#8C6A43] font-mono font-black text-sm flex items-center justify-center shadow-2xs">
                            {table.tableCode}
                          </span>
                          <div>
                            <span className="text-[10px] font-bold uppercase text-[#8C6A43] block leading-tight">
                              Box Bàn
                            </span>
                            <span className="font-serif font-bold text-sm text-[#1C1917] leading-none">
                              {table.tableCode}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                            table.isActive
                              ? 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]'
                              : 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]'
                          }`}
                        >
                          {table.isActive ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Hoạt Động</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3 h-3" />
                              <span>Tạm Ngừng</span>
                            </>
                          )}
                        </span>
                      </div>

                      {/* Middle Attributes Grid */}
                      <div className="grid grid-cols-2 gap-2 my-3 text-xs">
                        <div className="bg-[#FAF7F2] p-2 rounded-xl border border-[#EBE5DC]">
                          <span className="text-[10px] text-[#78716C] block flex items-center gap-1">
                            <Users className="w-3 h-3 text-[#8C6A43]" />
                            <span>Sức Chứa:</span>
                          </span>
                          <span className="font-bold text-[#1C1917]">
                            {table.minCapacity} - {table.maxCapacity} Khách
                          </span>
                        </div>

                        <div className="bg-[#FAF7F2] p-2 rounded-xl border border-[#EBE5DC]">
                          <span className="text-[10px] text-[#78716C] block">Khu Vực:</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md border inline-block mt-0.5 ${zoneInfo.badgeClass}`}>
                            {zoneInfo.label}
                          </span>
                        </div>

                        <div className="bg-[#FAF7F2] p-2 rounded-xl border border-[#EBE5DC]">
                          <span className="text-[10px] text-[#78716C] block">Hình Dáng:</span>
                          <span className="font-semibold text-[#1C1917]">
                            {table.shape === 'RECT' && 'Chữ Nhật'}
                            {table.shape === 'SQUARE' && 'Hình Vuông'}
                            {table.shape === 'CIRCLE' && 'Bàn Tròn'}
                          </span>
                        </div>

                        <div className="bg-[#FAF7F2] p-2 rounded-xl border border-[#EBE5DC]">
                          <span className="text-[10px] text-[#78716C] block">Tiền Cọc Riêng:</span>
                          <span className="font-bold text-[#3D7058] text-[11px]">
                            {table.customDeposit
                              ? `${new Intl.NumberFormat('vi-VN').format(table.customDeposit)}đ`
                              : 'Theo quán'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Quick Actions */}
                    <div className="pt-2.5 border-t border-[#EBE5DC]/80 flex items-center justify-between gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditTableModal(table);
                        }}
                        className="flex-1 py-1.5 px-2 bg-white hover:bg-[#FAF7F2] border border-[#E0D7C9] text-[#2C221E] font-semibold text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors"
                      >
                        <Edit3 className="w-3 h-3 text-[#8C6A43]" />
                        <span>Chỉnh Sửa</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleTableActive(table.id);
                        }}
                        className={`py-1.5 px-2.5 text-xs font-semibold rounded-xl border cursor-pointer transition-colors ${
                          table.isActive
                            ? 'border-amber-200 text-amber-800 bg-amber-50 hover:bg-amber-100'
                            : 'border-emerald-200 text-emerald-800 bg-emerald-50 hover:bg-emerald-100'
                        }`}
                        title={table.isActive ? 'Tạm ngừng hoạt động' : 'Kích hoạt lại'}
                      >
                        {table.isActive ? 'Tắt' : 'Bật'}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTable(table.id);
                        }}
                        className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 cursor-pointer transition-colors"
                        title="Xóa box bàn"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Inspector & Detail Panel (Span 1 Col) */}
        <div className="bg-white border border-[#EBE5DC] rounded-3xl p-5 shadow-sm space-y-5 sticky top-28">
          <div className="flex items-center justify-between pb-3 border-b border-[#EBE5DC]">
            <h3 className="font-serif font-bold text-base text-[#1C1917]">
              Chi Tiết Box Bàn
            </h3>
            <Sparkles className="w-4 h-4 text-[#C4A480]" />
          </div>

          {selectedTable ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E0D7C9]/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#8C6A43] tracking-wider block">
                      Đang Chọn
                    </span>
                    <h4 className="font-serif text-xl font-bold text-[#1C1917]">
                      Bàn {selectedTable.tableCode}
                    </h4>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      selectedTable.isActive
                        ? 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]'
                        : 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]'
                    }`}
                  >
                    {selectedTable.isActive ? 'Đang Hoạt Động' : 'Ngừng Phục Vụ'}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-[#EBE5DC]">
                    <span className="text-[#78716C]">Tầng:</span>
                    <span className="font-bold text-[#1C1917]">{currentFloor?.name}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-[#EBE5DC]">
                    <span className="text-[#78716C]">Khu Vực:</span>
                    <span className="font-bold text-[#8C6A43]">{getZoneBadge(selectedTable.zoneType).label}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-[#EBE5DC]">
                    <span className="text-[#78716C]">Sức Chứa:</span>
                    <span className="font-bold text-[#1C1917]">
                      {selectedTable.minCapacity} - {selectedTable.maxCapacity} Khách
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-[#EBE5DC]">
                    <span className="text-[#78716C]">Hình Dáng:</span>
                    <span className="font-bold text-[#1C1917]">
                      {selectedTable.shape === 'RECT' && 'Chữ Nhật'}
                      {selectedTable.shape === 'SQUARE' && 'Hình Vuông'}
                      {selectedTable.shape === 'CIRCLE' && 'Bàn Tròn'}
                    </span>
                  </div>

                  <div className="flex justify-between py-1">
                    <span className="text-[#78716C]">Tiền Cọc Riêng:</span>
                    <span className="font-bold text-[#3D7058]">
                      {selectedTable.customDeposit
                        ? `${new Intl.NumberFormat('vi-VN').format(selectedTable.customDeposit)} VNĐ`
                        : 'Theo Nhà Hàng'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={() => openEditTableModal(selectedTable)}
                  className="w-full btn-tan py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Chỉnh Sửa Thông Tin Bàn</span>
                </button>

                <button
                  onClick={() => handleToggleTableActive(selectedTable.id)}
                  className="w-full py-2 text-xs font-semibold rounded-xl border border-[#EBE5DC] hover:bg-[#FAF7F2] text-[#44403C] transition-colors cursor-pointer"
                >
                  {selectedTable.isActive ? 'Tạm Ngừng Hoạt Động Bàn' : 'Kích Hoạt Lại Bàn'}
                </button>

                <button
                  onClick={() => handleDeleteTable(selectedTable.id)}
                  className="w-full py-2 text-xs font-semibold rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa Bàn Khỏi Hệ Thống</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-[#78716C] space-y-2">
              <Maximize2 className="w-8 h-8 text-[#C4A480]/60 mx-auto" />
              <p className="text-xs">Chạm vào một Box bàn bất kỳ để xem thông số và chỉnh sửa nhanh.</p>
            </div>
          )}

          <div className="pt-4 border-t border-[#EBE5DC] text-[11px] text-[#78716C]">
            💡 <span className="font-semibold text-[#8C6A43]">Mẹo:</span> Bạn có thể lọc nhanh theo từng khu vực (VIP, View Kính, Ngoài trời...) ở thanh trên cùng để quản lý các Box bàn tập trung.
          </div>
        </div>
      </div>

      {/* CREATE / EDIT TABLE MODAL */}
      {isTableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#EBE5DC] space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#EBE5DC]">
              <h3 className="font-serif text-lg font-bold text-[#1C1917]">
                {modalMode === 'create' ? '+ Thêm Box Bàn Mới' : `Chỉnh Sửa Box Bàn ${tableFormData.tableCode}`}
              </h3>
              <button
                onClick={() => setIsTableModalOpen(false)}
                className="p-1 rounded-full text-[#78716C] hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitTableForm} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-[#2C221E] block mb-1">Mã Bàn *</label>
                <input
                  type="text"
                  required
                  value={tableFormData.tableCode}
                  onChange={(e) => setTableFormData({ ...tableFormData, tableCode: e.target.value })}
                  placeholder="VD: T-01, VIP-02, BAR-03..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E0D7C9] focus:outline-hidden focus:border-[#C4A480] bg-[#FAF7F2] font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#2C221E] block mb-1">Khu Vực (Zone) *</label>
                  <select
                    value={tableFormData.zoneType}
                    onChange={(e) => setTableFormData({ ...tableFormData, zoneType: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E0D7C9] focus:outline-hidden focus:border-[#C4A480] bg-[#FAF7F2]"
                  >
                    <option value="STANDARD">Tiêu Chuẩn (Standard)</option>
                    <option value="WINDOW_VIEW">Mặt Kính View Phố</option>
                    <option value="VIP">Phòng VIP Riêng Tư</option>
                    <option value="OUTDOOR">Ngoài Trời (Outdoor)</option>
                    <option value="BAR_SIDE">Cạnh Quầy Bar</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#2C221E] block mb-1">Hình Dạng *</label>
                  <select
                    value={tableFormData.shape}
                    onChange={(e) => setTableFormData({ ...tableFormData, shape: e.target.value as any })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E0D7C9] focus:outline-hidden focus:border-[#C4A480] bg-[#FAF7F2]"
                  >
                    <option value="RECT">Chữ Nhật (Rectangle)</option>
                    <option value="SQUARE">Hình Vuông (Square)</option>
                    <option value="CIRCLE">Bàn Tròn (Circle)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#2C221E] block mb-1">Sức Chứa Tối Thiểu *</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    required
                    value={tableFormData.minCapacity}
                    onChange={(e) => setTableFormData({ ...tableFormData, minCapacity: parseInt(e.target.value) || 1 })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E0D7C9] focus:outline-hidden focus:border-[#C4A480] bg-[#FAF7F2]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#2C221E] block mb-1">Sức Chứa Tối Đa *</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    required
                    value={tableFormData.maxCapacity}
                    onChange={(e) => setTableFormData({ ...tableFormData, maxCapacity: parseInt(e.target.value) || 1 })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E0D7C9] focus:outline-hidden focus:border-[#C4A480] bg-[#FAF7F2]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#2C221E] block mb-1">Tiền Cọc Bàn Riêng (VNĐ)</label>
                <input
                  type="number"
                  step={50000}
                  value={tableFormData.customDeposit}
                  onChange={(e) => setTableFormData({ ...tableFormData, customDeposit: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E0D7C9] focus:outline-hidden focus:border-[#C4A480] bg-[#FAF7F2]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveCheck"
                  checked={tableFormData.isActive}
                  onChange={(e) => setTableFormData({ ...tableFormData, isActive: e.target.checked })}
                  className="rounded-sm accent-[#C4A480] w-4 h-4"
                />
                <label htmlFor="isActiveCheck" className="text-xs font-semibold text-[#2C221E] cursor-pointer">
                  Kích hoạt bàn sẵn sàng đón khách
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EBE5DC]">
                <button
                  type="button"
                  onClick={() => setIsTableModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#78716C] hover:bg-gray-100 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn-tan px-6 py-2 text-xs font-bold shadow-xs cursor-pointer"
                >
                  {modalMode === 'create' ? 'Tạo Box Bàn' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
