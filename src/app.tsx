import { useState, useEffect, useMemo } from 'preact/hooks';
import * as Tabs from '@radix-ui/react-tabs';
import type { Court, Booking, Inspection, BookingStatus, CourtType } from './types';
import { BOOKING_STATUS_LABEL, COURT_TYPE_LABEL } from './types';
import {
  getCourts,
  addCourt,
  updateCourt,
  deleteCourt,
  getBookings,
  addBooking,
  deleteBooking,
  getBookingsByCourt,
  getInspections,
  addInspection,
  getInspectionsByCourt,
  initSampleData,
} from './lib/storage';
import { CourtCard } from './components/CourtCard';
import { CourtForm } from './components/CourtForm';
import { CourtDrawer } from './components/CourtDrawer';
import { BookingForm } from './components/BookingForm';
import { InspectionForm } from './components/InspectionForm';
import { Modal } from './components/Modal';
import { StatsOverview } from './components/StatsOverview';
import { formatDate } from './lib/utils';
import {
  Plus,
  Search,
  Filter,
  Building2,
  CalendarCheck,
  ClipboardList,
  Trash2,
  X,
} from 'lucide-preact';

type TabValue = 'overview' | 'courts' | 'bookings' | 'inspections';

export function App() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);

  const [activeTab, setActiveTab] = useState<TabValue>('overview');

  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<CourtType | 'all'>('all');
  const [zoneFilter, setZoneFilter] = useState('');
  const [abnormalOnly, setAbnormalOnly] = useState(false);

  const [showCourtForm, setShowCourtForm] = useState(false);
  const [editingCourt, setEditingCourt] = useState<Court | null>(null);

  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingCourtId, setBookingCourtId] = useState<string | undefined>(undefined);

  const [showInspectionForm, setShowInspectionForm] = useState(false);
  const [inspectionCourtId, setInspectionCourtId] = useState<string | undefined>(undefined);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingCourt, setDeletingCourt] = useState<Court | null>(null);

  useEffect(() => {
    initSampleData();
    refreshData();
  }, []);

  const refreshData = () => {
    setCourts(getCourts());
    setBookings(getBookings());
    setInspections(getInspections());
  };

  const zones = useMemo(() => {
    const zoneSet = new Set(courts.map((c) => c.zone).filter(Boolean));
    return Array.from(zoneSet);
  }, [courts]);

  const filteredCourts = useMemo(() => {
    return courts.filter((court) => {
      if (searchText) {
        const search = searchText.toLowerCase();
        if (
          !court.code.toLowerCase().includes(search) &&
          !court.name.toLowerCase().includes(search)
        ) {
          return false;
        }
      }
      if (statusFilter !== 'all' && court.bookingStatus !== statusFilter) {
        return false;
      }
      if (typeFilter !== 'all' && court.type !== typeFilter) {
        return false;
      }
      if (zoneFilter && court.zone !== zoneFilter) {
        return false;
      }
      if (abnormalOnly && court.lightingStatus === 'normal' && court.floorStatus === 'normal') {
        return false;
      }
      return true;
    });
  }, [courts, searchText, statusFilter, typeFilter, zoneFilter, abnormalOnly]);

  const handleAddCourt = () => {
    setEditingCourt(null);
    setShowCourtForm(true);
  };

  const handleEditCourt = (court: Court) => {
    setEditingCourt(court);
    setShowCourtForm(true);
  };

  const handleViewCourt = (court: Court) => {
    setSelectedCourt(court);
    setDrawerOpen(true);
  };

  const handleDeleteCourt = (court: Court) => {
    setDeletingCourt(court);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (deletingCourt) {
      deleteCourt(deletingCourt.id);
      refreshData();
      if (selectedCourt?.id === deletingCourt.id) {
        setDrawerOpen(false);
        setSelectedCourt(null);
      }
    }
    setShowDeleteConfirm(false);
    setDeletingCourt(null);
  };

  const handleCourtSubmit = (data: Omit<Court, 'id' | 'createdAt'>) => {
    if (editingCourt) {
      updateCourt(editingCourt.id, data);
    } else {
      addCourt(data);
    }
    refreshData();
    setShowCourtForm(false);
    setEditingCourt(null);
  };

  const handleAddBooking = (courtId?: string) => {
    setBookingCourtId(courtId);
    setShowBookingForm(true);
  };

  const handleBookingSubmit = (data: Omit<Booking, 'id' | 'createdAt'>) => {
    addBooking(data);
    refreshData();
    setShowBookingForm(false);
    setBookingCourtId(undefined);
  };

  const handleCancelBooking = (id: string) => {
    deleteBooking(id);
    refreshData();
  };

  const handleAddInspection = (courtId?: string) => {
    setInspectionCourtId(courtId);
    setShowInspectionForm(true);
  };

  const handleInspectionSubmit = (data: Omit<Inspection, 'id'>) => {
    addInspection(data);
    refreshData();
    setShowInspectionForm(false);
    setInspectionCourtId(undefined);
  };

  const resetFilters = () => {
    setSearchText('');
    setStatusFilter('all');
    setTypeFilter('all');
    setZoneFilter('');
    setAbnormalOnly(false);
  };

  const courtBookings = selectedCourt ? getBookingsByCourt(selectedCourt.id) : [];
  const courtInspections = selectedCourt ? getInspectionsByCourt(selectedCourt.id) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-600 rounded-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">羽毛球馆运营管理</h1>
                <p className="text-xs text-gray-500">场地维护 · 预订管理 · 设备巡检</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="btn-primary" onClick={handleAddCourt}>
                <Plus className="w-4 h-4" />
                新增场地
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs.Root value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
          <Tabs.List className="flex gap-1 mb-6 border-b border-gray-200">
            <Tabs.Trigger
              value="overview"
              className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent data-[state=active]:text-emerald-600 data-[state=active]:border-emerald-600"
            >
              <span className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                统计概览
              </span>
            </Tabs.Trigger>
            <Tabs.Trigger
              value="courts"
              className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent data-[state=active]:text-emerald-600 data-[state=active]:border-emerald-600"
            >
              <span className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                场地管理
              </span>
            </Tabs.Trigger>
            <Tabs.Trigger
              value="bookings"
              className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent data-[state=active]:text-emerald-600 data-[state=active]:border-emerald-600"
            >
              <span className="flex items-center gap-2">
                <CalendarCheck className="w-4 h-4" />
                预订管理
              </span>
            </Tabs.Trigger>
            <Tabs.Trigger
              value="inspections"
              className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent data-[state=active]:text-emerald-600 data-[state=active]:border-emerald-600"
            >
              <span className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4" />
                巡检记录
              </span>
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="overview">
            <StatsOverview courts={courts} bookings={bookings} inspections={inspections} />
          </Tabs.Content>

          <Tabs.Content value="courts">
            <div className="mb-6 space-y-4">
              <div className="flex flex-wrap gap-3 items-end">
                <div className="flex-1 min-w-[240px]">
                  <label className="label">搜索</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      className="input pl-9"
                      placeholder="搜索场地编号或名称..."
                      value={searchText}
                      onInput={(e) => setSearchText((e.target as HTMLInputElement).value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="label">预订状态</label>
                  <select
                    className="input min-w-[140px]"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter((e.target as HTMLSelectElement).value as BookingStatus | 'all')}
                  >
                    <option value="all">全部状态</option>
                    {Object.entries(BOOKING_STATUS_LABEL).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">场地类型</label>
                  <select
                    className="input min-w-[140px]"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter((e.target as HTMLSelectElement).value as CourtType | 'all')}
                  >
                    <option value="all">全部类型</option>
                    {Object.entries(COURT_TYPE_LABEL).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">所在区域</label>
                  <select
                    className="input min-w-[140px]"
                    value={zoneFilter}
                    onChange={(e) => setZoneFilter((e.target as HTMLSelectElement).value)}
                  >
                    <option value="">全部区域</option>
                    {zones.map((zone) => (
                      <option key={zone} value={zone}>
                        {zone}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end gap-2">
                  <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={abnormalOnly}
                      onChange={(e) => setAbnormalOnly((e.target as HTMLInputElement).checked)}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <span className="text-sm text-gray-700">仅显示异常</span>
                  </label>
                  <button className="btn-secondary" onClick={resetFilters}>
                    <X className="w-4 h-4" />
                    重置
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Filter className="w-4 h-4" />
                共找到 {filteredCourts.length} 个场地
              </div>
            </div>

            {filteredCourts.length === 0 ? (
              <div className="card p-12 text-center">
                <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">暂无符合条件的场地</p>
                <button className="btn-primary mt-4" onClick={handleAddCourt}>
                  <Plus className="w-4 h-4" />
                  添加第一个场地
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCourts.map((court) => (
                  <CourtCard
                    key={court.id}
                    court={court}
                    onView={handleViewCourt}
                    onEdit={handleEditCourt}
                    onDelete={handleDeleteCourt}
                  />
                ))}
              </div>
            )}
          </Tabs.Content>

          <Tabs.Content value="bookings">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">预订记录</h2>
              <button className="btn-primary" onClick={() => handleAddBooking()}>
                <Plus className="w-4 h-4" />
                新增预订
              </button>
            </div>
            <div className="card overflow-hidden">
              {bookings.length === 0 ? (
                <div className="p-12 text-center">
                  <CalendarCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">暂无预订记录</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                        场地
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                        客户信息
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                        日期
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                        时间
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                        备注
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {bookings.map((booking) => {
                      const court = courts.find((c) => c.id === booking.courtId);
                      return (
                        <tr key={booking.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">
                            <span className="font-medium text-gray-900">
                              {court?.name || '已删除'}
                            </span>
                            <span className="text-gray-500 ml-1">({court?.code || '-'})</span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="text-gray-900 font-medium">{booking.customerName}</div>
                            <div className="text-gray-500 text-xs">{booking.customerPhone}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{booking.date}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {booking.startTime} - {booking.endTime}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500 max-w-[200px] truncate">
                            {booking.notes || '-'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              className="text-red-600 hover:text-red-700 text-sm inline-flex items-center gap-1"
                              onClick={() => handleCancelBooking(booking.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                              取消
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </Tabs.Content>

          <Tabs.Content value="inspections">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">巡检记录</h2>
              <button className="btn-primary" onClick={() => handleAddInspection()}>
                <Plus className="w-4 h-4" />
                新增巡检
              </button>
            </div>
            <div className="card overflow-hidden">
              {inspections.length === 0 ? (
                <div className="p-12 text-center">
                  <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">暂无巡检记录</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                        场地
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                        巡检日期
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                        巡检人
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                        问题类型
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                        处理状态
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                        备注
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {inspections.map((inspection) => {
                      const court = courts.find((c) => c.id === inspection.courtId);
                      return (
                        <tr key={inspection.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">
                            <span className="font-medium text-gray-900">
                              {court?.name || '已删除'}
                            </span>
                            <span className="text-gray-500 ml-1">({court?.code || '-'})</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {formatDate(inspection.date)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{inspection.inspector}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {({
                              lighting: '照明问题',
                              floor: '地胶问题',
                              net: '球网问题',
                              equipment: '设备问题',
                              other: '其他问题',
                            } as Record<string, string>)[inspection.problemType]}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`badge ${
                                inspection.status === 'resolved'
                                  ? 'bg-green-100 text-green-700'
                                  : inspection.status === 'processing'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {({
                                pending: '待处理',
                                processing: '处理中',
                                resolved: '已解决',
                              } as Record<string, string>)[inspection.status]}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500 max-w-[200px] truncate">
                            {inspection.notes || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </Tabs.Content>
        </Tabs.Root>
      </main>

      <CourtDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        court={selectedCourt}
        bookings={courtBookings}
        inspections={courtInspections}
        onEdit={() => {
          if (selectedCourt) {
            setDrawerOpen(false);
            handleEditCourt(selectedCourt);
          }
        }}
        onAddBooking={() => {
          if (selectedCourt) {
            setDrawerOpen(false);
            handleAddBooking(selectedCourt.id);
          }
        }}
        onAddInspection={() => {
          if (selectedCourt) {
            setDrawerOpen(false);
            handleAddInspection(selectedCourt.id);
          }
        }}
        onCancelBooking={handleCancelBooking}
      />

      <Modal
        open={showCourtForm}
        onClose={() => {
          setShowCourtForm(false);
          setEditingCourt(null);
        }}
        title={editingCourt ? '编辑场地' : '新增场地'}
      >
        <CourtForm
          court={editingCourt || undefined}
          onSubmit={handleCourtSubmit}
          onCancel={() => {
            setShowCourtForm(false);
            setEditingCourt(null);
          }}
        />
      </Modal>

      <Modal
        open={showBookingForm}
        onClose={() => {
          setShowBookingForm(false);
          setBookingCourtId(undefined);
        }}
        title="预订登记"
      >
        <BookingForm
          courts={courts}
          selectedCourtId={bookingCourtId}
          onSubmit={handleBookingSubmit}
          onCancel={() => {
            setShowBookingForm(false);
            setBookingCourtId(undefined);
          }}
        />
      </Modal>

      <Modal
        open={showInspectionForm}
        onClose={() => {
          setShowInspectionForm(false);
          setInspectionCourtId(undefined);
        }}
        title="新增巡检记录"
      >
        <InspectionForm
          courts={courts}
          selectedCourtId={inspectionCourtId}
          onSubmit={handleInspectionSubmit}
          onCancel={() => {
            setShowInspectionForm(false);
            setInspectionCourtId(undefined);
          }}
        />
      </Modal>

      <Modal
        open={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeletingCourt(null);
        }}
        title="确认删除"
      >
        <p className="text-sm text-gray-600 mb-6">
          确定要删除场地 <span className="font-medium text-gray-900">{deletingCourt?.name}</span> 吗？
          此操作不可撤销。
        </p>
        <div className="flex justify-end gap-3">
          <button
            className="btn-secondary"
            onClick={() => {
              setShowDeleteConfirm(false);
              setDeletingCourt(null);
            }}
          >
            取消
          </button>
          <button className="btn-danger" onClick={confirmDelete}>
            确认删除
          </button>
        </div>
      </Modal>
    </div>
  );
}
