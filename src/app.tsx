import { useState, useEffect, useMemo } from 'preact/hooks';
import * as Tabs from '@radix-ui/react-tabs';
import type {
  Court,
  Booking,
  Inspection,
  BookingStatus,
  CourtType,
  Member,
  MemberTransaction,
  MemberLevel,
  MemberStatus,
  TransactionType,
  MemberPackage,
  PackageType,
} from './types';
import {
  BOOKING_STATUS_LABEL,
  COURT_TYPE_LABEL,
  BOOKING_PROGRESS_STATUS_LABEL,
  MEMBER_LEVEL_LABEL,
  MEMBER_STATUS_LABEL,
  TRANSACTION_TYPE_LABEL,
} from './types';
import {
  getCourts,
  addCourt,
  updateCourt,
  deleteCourt,
  getBookings,
  addBooking,
  deleteBooking,
  updateBooking,
  getBookingsByCourt,
  getInspections,
  addInspection,
  getInspectionsByCourt,
  initSampleData,
  getMembers,
  addMember,
  updateMember,
  deleteMember,
  getMemberTransactions,
  getTransactionsByMember,
  createMemberTransaction,
  settleBooking,
  getMemberPackages,
  getPackagesByMember,
  addMemberPackage,
  updateMemberPackage,
  deleteMemberPackage,
} from './lib/storage';
import { CourtCard } from './components/CourtCard';
import { CourtForm } from './components/CourtForm';
import { CourtDrawer } from './components/CourtDrawer';
import { BookingForm } from './components/BookingForm';
import { RescheduleForm } from './components/RescheduleForm';
import { InspectionForm } from './components/InspectionForm';
import { Modal } from './components/Modal';
import { StatsOverview } from './components/StatsOverview';
import { MemberForm } from './components/MemberForm';
import { MemberTransactionForm } from './components/MemberTransactionForm';
import { MemberHistoryDrawer } from './components/MemberHistoryDrawer';
import { PackageForm } from './components/PackageForm';
import { MemberPackageDrawer } from './components/MemberPackageDrawer';
import { formatDate, getBookingProgressStatus, getBookingProgressBadgeClass, calculateBookingAmount } from './lib/utils';
import {
  Plus,
  Search,
  Filter,
  Building2,
  CalendarCheck,
  ClipboardList,
  Trash2,
  X,
  CalendarClock,
  ChevronDown,
  ChevronUp,
  History,
  Users,
  Wallet,
  CreditCard,
  Eye,
  Edit2,
  ArrowUpCircle,
  ArrowDownCircle,
  Gift,
  CheckCircle,
  Banknote,
  Ticket,
} from 'lucide-preact';

type TabValue = 'overview' | 'courts' | 'bookings' | 'inspections' | 'members' | 'transactions';

export function App() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [transactions, setTransactions] = useState<MemberTransaction[]>([]);
  const [memberPackages, setMemberPackages] = useState<MemberPackage[]>([]);

  const [activeTab, setActiveTab] = useState<TabValue>('overview');

  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<CourtType | 'all'>('all');
  const [zoneFilter, setZoneFilter] = useState('');
  const [abnormalOnly, setAbnormalOnly] = useState(false);

  const [memberSearchText, setMemberSearchText] = useState('');
  const [memberLevelFilter, setMemberLevelFilter] = useState<MemberLevel | 'all'>('all');
  const [memberStatusFilter, setMemberStatusFilter] = useState<MemberStatus | 'all'>('all');

  const [txMemberFilter, setTxMemberFilter] = useState<string>('all');
  const [txTypeFilter, setTxTypeFilter] = useState<TransactionType | 'all'>('all');
  const [txStartDate, setTxStartDate] = useState('');
  const [txEndDate, setTxEndDate] = useState('');

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

  const [showRescheduleForm, setShowRescheduleForm] = useState(false);
  const [reschedulingBooking, setReschedulingBooking] = useState<Booking | null>(null);

  const [expandedBookingIds, setExpandedBookingIds] = useState<Set<string>>(new Set());

  const [showMemberForm, setShowMemberForm] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  const [showMemberDeleteConfirm, setShowMemberDeleteConfirm] = useState(false);
  const [deletingMember, setDeletingMember] = useState<Member | null>(null);

  const [showMemberTxForm, setShowMemberTxForm] = useState(false);
  const [transactionMember, setTransactionMember] = useState<Member | null>(null);

  const [memberHistoryOpen, setMemberHistoryOpen] = useState(false);
  const [historyMember, setHistoryMember] = useState<Member | null>(null);

  const [memberPackageOpen, setMemberPackageOpen] = useState(false);
  const [packageMember, setPackageMember] = useState<Member | null>(null);

  const [showPackageForm, setShowPackageForm] = useState(false);
  const [packageFormMember, setPackageFormMember] = useState<Member | null>(null);
  const [editingPackage, setEditingPackage] = useState<MemberPackage | null>(null);

  const [showPackageDeleteConfirm, setShowPackageDeleteConfirm] = useState(false);
  const [deletingPackage, setDeletingPackage] = useState<MemberPackage | null>(null);

  const [txPackageFilter, setTxPackageFilter] = useState<'all' | 'has_package' | 'no_package'>('all');

  useEffect(() => {
    initSampleData();
    refreshData();
  }, []);

  const refreshData = () => {
    setCourts(getCourts());
    setBookings(getBookings());
    setInspections(getInspections());
    setMembers(getMembers());
    setTransactions(getMemberTransactions());
    setMemberPackages(getMemberPackages());
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

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      if (memberSearchText) {
        const search = memberSearchText.toLowerCase();
        if (
          !member.name.toLowerCase().includes(search) &&
          !member.phone.includes(search)
        ) {
          return false;
        }
      }
      if (memberLevelFilter !== 'all' && member.level !== memberLevelFilter) {
        return false;
      }
      if (memberStatusFilter !== 'all' && member.status !== memberStatusFilter) {
        return false;
      }
      return true;
    });
  }, [members, memberSearchText, memberLevelFilter, memberStatusFilter]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (txMemberFilter !== 'all' && tx.memberId !== txMemberFilter) {
        return false;
      }
      if (txTypeFilter !== 'all' && tx.type !== txTypeFilter) {
        return false;
      }
      if (txPackageFilter === 'has_package') {
        if (!tx.packageDeductions || tx.packageDeductions.length === 0) {
          return false;
        }
      }
      if (txPackageFilter === 'no_package') {
        if (tx.packageDeductions && tx.packageDeductions.length > 0) {
          return false;
        }
      }
      const txDate = new Date(tx.createdAt).toISOString().split('T')[0];
      if (txStartDate && txDate < txStartDate) {
        return false;
      }
      if (txEndDate && txDate > txEndDate) {
        return false;
      }
      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [transactions, txMemberFilter, txTypeFilter, txPackageFilter, txStartDate, txEndDate]);

  const getTxIcon = (type: string) => {
    switch (type) {
      case 'recharge':
      case 'refund':
      case 'gift_amount':
        return <ArrowUpCircle className="w-4 h-4 text-emerald-600" />;
      case 'deduct':
      case 'consume':
        return <ArrowDownCircle className="w-4 h-4 text-red-600" />;
      case 'gift_hours':
        return <Gift className="w-4 h-4 text-blue-600" />;
      case 'package_purchase':
        return <Ticket className="w-4 h-4 text-purple-600" />;
      case 'package_deduct':
        return <Ticket className="w-4 h-4 text-purple-600" />;
      default:
        return <CreditCard className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTxColor = (type: string) => {
    switch (type) {
      case 'recharge':
      case 'refund':
      case 'gift_amount':
        return 'text-emerald-600';
      case 'deduct':
      case 'consume':
        return 'text-red-600';
      case 'gift_hours':
        return 'text-blue-600';
      case 'package_purchase':
      case 'package_deduct':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTxPrefix = (type: string) => {
    switch (type) {
      case 'recharge':
      case 'refund':
      case 'gift_amount':
      case 'gift_hours':
      case 'package_purchase':
        return '+';
      case 'deduct':
      case 'consume':
      case 'package_deduct':
        return '-';
      default:
        return '';
    }
  };

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

  const confirmDeleteCourt = () => {
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

  const handleRescheduleBooking = (booking: Booking) => {
    setReschedulingBooking(booking);
    setShowRescheduleForm(true);
  };

  const handleRescheduleSubmit = (data: { date: string; startTime: string; endTime: string }) => {
    if (reschedulingBooking) {
      updateBooking(reschedulingBooking.id, data);
      refreshData();
    }
    setShowRescheduleForm(false);
    setReschedulingBooking(null);
  };

  const handleSettleBooking = (booking: Booking) => {
    const result = settleBooking(booking.id);
    if (!result.success) {
      alert(result.message || '结算失败');
    } else {
      let msg = `结算成功，总金额：¥${result.amount?.toFixed(2)}`;
      if (result.settleDetails && result.settleDetails.packageDeductions.length > 0) {
        msg += '\n\n套餐抵扣明细：';
        result.settleDetails.packageDeductions.forEach((d) => {
          const parts = [];
          if (d.deductedCount > 0) parts.push(`${d.deductedCount}次`);
          if (d.deductedHours > 0) parts.push(`${d.deductedHours}小时`);
          msg += `\n  • ${d.packageName}（${parts.join(' / ')}）：-¥${d.deductedAmount.toFixed(2)}`;
        });
        if (result.settleDetails.balanceDeduction > 0) {
          msg += `\n  • 储值余额补扣：-¥${result.settleDetails.balanceDeduction.toFixed(2)}`;
        }
      }
      alert(msg);
      refreshData();
    }
  };

  const toggleBookingExpand = (bookingId: string) => {
    setExpandedBookingIds((prev) => {
      const next = new Set(prev);
      if (next.has(bookingId)) {
        next.delete(bookingId);
      } else {
        next.add(bookingId);
      }
      return next;
    });
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

  const resetMemberFilters = () => {
    setMemberSearchText('');
    setMemberLevelFilter('all');
    setMemberStatusFilter('all');
  };

  const resetTxFilters = () => {
    setTxMemberFilter('all');
    setTxTypeFilter('all');
    setTxPackageFilter('all');
    setTxStartDate('');
    setTxEndDate('');
  };

  const handleAddMember = () => {
    setEditingMember(null);
    setShowMemberForm(true);
  };

  const handleEditMember = (member: Member) => {
    setEditingMember(member);
    setShowMemberForm(true);
  };

  const handleMemberSubmit = (data: Omit<Member, 'id' | 'balance' | 'giftHours'>) => {
    if (editingMember) {
      updateMember(editingMember.id, data);
    } else {
      addMember(data);
    }
    refreshData();
    setShowMemberForm(false);
    setEditingMember(null);
  };

  const handleDeleteMember = (member: Member) => {
    setDeletingMember(member);
    setShowMemberDeleteConfirm(true);
  };

  const confirmDeleteMember = () => {
    if (deletingMember) {
      deleteMember(deletingMember.id);
      refreshData();
    }
    setShowMemberDeleteConfirm(false);
    setDeletingMember(null);
  };

  const handleMemberTransaction = (member: Member) => {
    setTransactionMember(member);
    setShowMemberTxForm(true);
  };

  const handleMemberTransactionSubmit = (data: {
    type: TransactionType;
    amount: number;
    hours: number;
    remark?: string;
  }): { success: boolean; message?: string } => {
    if (!transactionMember) {
      return { success: false, message: '请选择会员' };
    }
    const result = createMemberTransaction({
      memberId: transactionMember.id,
      ...data,
    });
    if (result.success) {
      refreshData();
    }
    return { success: result.success, message: result.message };
  };

  const handleViewMemberHistory = (member: Member) => {
    setHistoryMember(member);
    setMemberHistoryOpen(true);
  };

  const handleViewMemberPackages = (member: Member) => {
    setPackageMember(member);
    setMemberPackageOpen(true);
  };

  const handleAddPackage = (member: Member) => {
    setPackageFormMember(member);
    setEditingPackage(null);
    setShowPackageForm(true);
  };

  const handleEditPackage = (pkg: MemberPackage) => {
    setEditingPackage(pkg);
    const member = members.find((m) => m.id === pkg.memberId);
    setPackageFormMember(member || null);
    setShowPackageForm(true);
  };

  const handleDeletePackage = (pkg: MemberPackage) => {
    setDeletingPackage(pkg);
    setShowPackageDeleteConfirm(true);
  };

  const confirmDeletePackage = () => {
    if (deletingPackage) {
      deleteMemberPackage(deletingPackage.id);
      refreshData();
    }
    setShowPackageDeleteConfirm(false);
    setDeletingPackage(null);
  };

  const handlePackageSubmit = (data: {
    name: string;
    type: PackageType;
    validFrom: string;
    validTo: string;
    totalCount: number;
    totalHours: number;
    applicableCourtTypes: CourtType[];
    applicableTimeSlots: string[];
  }): { success: boolean; message?: string } => {
    if (!packageFormMember) {
      return { success: false, message: '请选择会员' };
    }
    try {
      if (editingPackage) {
        updateMemberPackage(editingPackage.id, {
          name: data.name,
          type: data.type,
          totalCount: data.totalCount,
          totalHours: data.totalHours,
          applicableCourtTypes: data.applicableCourtTypes,
          applicableTimeSlots: data.applicableTimeSlots,
          validFrom: data.validFrom,
          validTo: data.validTo,
        });
      } else {
        addMemberPackage({
          memberId: packageFormMember.id,
          name: data.name,
          type: data.type,
          totalCount: data.totalCount,
          totalHours: data.totalHours,
          applicableCourtTypes: data.applicableCourtTypes,
          applicableTimeSlots: data.applicableTimeSlots,
          validFrom: data.validFrom,
          validTo: data.validTo,
        });
      }
      refreshData();
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message || '保存失败' };
    }
  };

  const courtBookings = selectedCourt ? getBookingsByCourt(selectedCourt.id) : [];
  const courtInspections = selectedCourt ? getInspectionsByCourt(selectedCourt.id) : [];
  const historyMemberTransactions = historyMember ? getTransactionsByMember(historyMember.id) : [];

  const getMemberById = (id?: string) => members.find((m) => m.id === id);

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
                <p className="text-xs text-gray-500">场地维护 · 预订管理 · 会员储值 · 设备巡检</p>
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
          <Tabs.List className="flex flex-wrap gap-1 mb-6 border-b border-gray-200">
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
              value="members"
              className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent data-[state=active]:text-emerald-600 data-[state=active]:border-emerald-600"
            >
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                会员管理
              </span>
            </Tabs.Trigger>
            <Tabs.Trigger
              value="transactions"
              className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent data-[state=active]:text-emerald-600 data-[state=active]:border-emerald-600"
            >
              <span className="flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                交易记录
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
            <StatsOverview
              courts={courts}
              bookings={bookings}
              inspections={inspections}
              members={members}
              transactions={transactions}
            />
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
                        会员
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                        日期
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                        时间
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                        状态
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                        费用
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                        结算状态
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
                      const progressStatus = getBookingProgressStatus(booking);
                      const isExpanded = expandedBookingIds.has(booking.id);
                      const hasChanges = booking.changeHistory && booking.changeHistory.length > 0;
                      const member = booking.memberId ? getMemberById(booking.memberId) : null;
                      const estimatedAmount = court ? calculateBookingAmount(booking.startTime, booking.endTime, court.type) : 0;
                      const displayAmount = booking.settledAmount ?? estimatedAmount;
                      return (
                        <>
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
                            <td className="px-4 py-3 text-sm">
                              {member ? (
                                <div>
                                  <div className="text-emerald-700 font-medium">{member.name}</div>
                                  <div className="text-xs text-emerald-600">
                                    余额 ¥{member.balance.toFixed(2)}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-gray-400">散客</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">{booking.date}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {booking.startTime} - {booking.endTime}
                              {(hasChanges || (booking.settled && booking.settleDetails)) && (
                                <span className="ml-2 text-emerald-600 text-xs">
                                  <button
                                    onClick={() => toggleBookingExpand(booking.id)}
                                    className="inline-flex items-center gap-1 align-middle"
                                    title={hasChanges ? '查看变更历史和抵扣明细' : '查看抵扣明细'}
                                  >
                                    {hasChanges ? (
                                      <History className="w-3.5 h-3.5" />
                                    ) : (
                                      <Ticket className="w-3.5 h-3.5 text-purple-600" />
                                    )}
                                    {hasChanges && <span>改期{booking.changeHistory!.length}次</span>}
                                    {!hasChanges && booking.settleDetails && <span className="text-purple-600">已抵扣</span>}
                                    {isExpanded ? (
                                      <ChevronUp className="w-3.5 h-3.5" />
                                    ) : (
                                      <ChevronDown className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`badge ${getBookingProgressBadgeClass(progressStatus)}`}>
                                {BOOKING_PROGRESS_STATUS_LABEL[progressStatus]}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                              ¥{displayAmount.toFixed(2)}
                            </td>
                            <td className="px-4 py-3">
                              {booking.settled ? (
                                <span className="badge bg-green-100 text-green-700 inline-flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  已结算
                                </span>
                              ) : (
                                <span className="badge bg-yellow-100 text-yellow-700">
                                  待结算
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500 max-w-[160px] truncate">
                              {booking.notes || '-'}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="inline-flex items-center gap-3">
                                {!booking.settled && (
                                  <button
                                    className="text-blue-600 hover:text-blue-700 text-sm inline-flex items-center gap-1"
                                    onClick={() => handleSettleBooking(booking)}
                                    title="结算并生成消费记录"
                                  >
                                    <Banknote className="w-4 h-4" />
                                    结算
                                  </button>
                                )}
                                {!booking.settled && (
                                  <button
                                    className="text-emerald-600 hover:text-emerald-700 text-sm inline-flex items-center gap-1"
                                    onClick={() => handleRescheduleBooking(booking)}
                                  >
                                    <CalendarClock className="w-4 h-4" />
                                    改期
                                  </button>
                                )}
                                <button
                                  className="text-red-600 hover:text-red-700 text-sm inline-flex items-center gap-1"
                                  onClick={() => handleCancelBooking(booking.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                  {booking.settled ? '删除' : '取消'}
                                </button>
                              </div>
                            </td>
                          </tr>
                          {isExpanded && (hasChanges || (booking.settled && booking.settleDetails)) && (
                            <tr key={`${booking.id}-details`} className="bg-gray-50">
                              <td colSpan={10} className="px-4 py-3">
                                <div className="space-y-4">
                                  {booking.settled && booking.settleDetails && booking.settleDetails.packageDeductions.length > 0 && (
                                    <div className="space-y-2">
                                      <p className="text-xs font-medium text-purple-700 flex items-center gap-1">
                                        <Ticket className="w-3.5 h-3.5" />
                                        套餐抵扣明细
                                      </p>
                                      <div className="bg-white border border-purple-200 rounded-md p-3 space-y-2">
                                        {booking.settleDetails.packageDeductions.map((d, i) => (
                                          <div key={i} className="flex justify-between text-xs">
                                            <span className="text-gray-700">
                                              🎟️ {d.packageName}
                                              {d.deductedCount > 0 && <span className="ml-2">{d.deductedCount}次</span>}
                                              {d.deductedHours > 0 && <span className="ml-2">{d.deductedHours}小时</span>}
                                            </span>
                                            <span className="text-purple-600 font-medium">
                                              -¥{d.deductedAmount.toFixed(2)}
                                            </span>
                                          </div>
                                        ))}
                                        {booking.settleDetails.balanceDeduction > 0 && (
                                          <div className="flex justify-between text-xs pt-2 border-t border-gray-100">
                                            <span className="text-gray-700">💰 储值余额补扣</span>
                                            <span className="text-amber-600 font-medium">
                                              -¥{booking.settleDetails.balanceDeduction.toFixed(2)}
                                            </span>
                                          </div>
                                        )}
                                        <div className="flex justify-between text-xs pt-2 border-t border-gray-200 font-medium">
                                          <span className="text-gray-900">合计</span>
                                          <span className="text-red-600">
                                            -¥{(
                                              booking.settleDetails.packageDeductions.reduce((sum, d) => sum + d.deductedAmount, 0) +
                                              booking.settleDetails.balanceDeduction
                                            ).toFixed(2)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {hasChanges && (
                                    <div className="space-y-2">
                                      <p className="text-xs font-medium text-gray-600 flex items-center gap-1">
                                        <History className="w-3.5 h-3.5" />
                                        变更历史
                                      </p>
                                      <div className="space-y-2">
                                        {[...booking.changeHistory!].reverse().map((change) => (
                                          <div
                                            key={change.id}
                                            className="bg-white border border-gray-200 rounded-md p-3 text-xs text-gray-600"
                                          >
                                            <p className="text-gray-500 mb-1">
                                              {new Date(change.changedAt).toLocaleString('zh-CN')}
                                            </p>
                                            <div className="flex items-center gap-2">
                                              <span className="text-red-600">
                                                {change.previousDate} {change.previousStartTime}-{change.previousEndTime}
                                              </span>
                                              <span className="text-gray-400">→</span>
                                              <span className="text-emerald-600 font-medium">
                                                {change.newDate} {change.newStartTime}-{change.newEndTime}
                                              </span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </Tabs.Content>

          <Tabs.Content value="members">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">会员管理</h2>
              <button className="btn-primary" onClick={handleAddMember}>
                <Plus className="w-4 h-4" />
                新增会员
              </button>
            </div>

            <div className="mb-6 space-y-4">
              <div className="flex flex-wrap gap-3 items-end">
                <div className="flex-1 min-w-[240px]">
                  <label className="label">搜索</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      className="input pl-9"
                      placeholder="搜索会员姓名或手机号..."
                      value={memberSearchText}
                      onInput={(e) => setMemberSearchText((e.target as HTMLInputElement).value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="label">会员等级</label>
                  <select
                    className="input min-w-[140px]"
                    value={memberLevelFilter}
                    onChange={(e) => setMemberLevelFilter((e.target as HTMLSelectElement).value as MemberLevel | 'all')}
                  >
                    <option value="all">全部等级</option>
                    {Object.entries(MEMBER_LEVEL_LABEL).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">会员状态</label>
                  <select
                    className="input min-w-[140px]"
                    value={memberStatusFilter}
                    onChange={(e) => setMemberStatusFilter((e.target as HTMLSelectElement).value as MemberStatus | 'all')}
                  >
                    <option value="all">全部状态</option>
                    {Object.entries(MEMBER_STATUS_LABEL).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <button className="btn-secondary" onClick={resetMemberFilters}>
                  <X className="w-4 h-4" />
                  重置
                </button>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Filter className="w-4 h-4" />
                共找到 {filteredMembers.length} 个会员
              </div>
            </div>

            <div className="card overflow-hidden">
              {filteredMembers.length === 0 ? (
                <div className="p-12 text-center">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">暂无会员记录</p>
                  <button className="btn-primary mt-4" onClick={handleAddMember}>
                    <Plus className="w-4 h-4" />
                    添加第一个会员
                  </button>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                        会员信息
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                        等级
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                        可用余额
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                        赠送课时
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                        开卡日期
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                        状态
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">
                          <div className="text-gray-900 font-medium">{member.name}</div>
                          <div className="text-gray-500 text-xs">{member.phone}</div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className="badge bg-purple-100 text-purple-700">
                            {MEMBER_LEVEL_LABEL[member.level]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`font-semibold ${member.balance === 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                            ¥{member.balance.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-blue-600 font-medium">
                          {member.giftHours} 小时
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {formatDate(member.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`badge ${
                              member.status === 'active'
                                ? 'bg-green-100 text-green-700'
                                : member.status === 'frozen'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {MEMBER_STATUS_LABEL[member.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-3">
                            <button
                              className="text-gray-600 hover:text-gray-700 text-sm inline-flex items-center gap-1"
                              onClick={() => handleViewMemberHistory(member)}
                              title="查看交易记录"
                            >
                              <Eye className="w-4 h-4" />
                              明细
                            </button>
                            <button
                              className="text-emerald-600 hover:text-emerald-700 text-sm inline-flex items-center gap-1"
                              onClick={() => handleMemberTransaction(member)}
                              title="储值/扣费/退款"
                            >
                              <Wallet className="w-4 h-4" />
                              交易
                            </button>
                            <button
                              className="text-purple-600 hover:text-purple-700 text-sm inline-flex items-center gap-1"
                              onClick={() => handleViewMemberPackages(member)}
                              title="查看套餐"
                            >
                              <Ticket className="w-4 h-4" />
                              套餐
                              {memberPackages.filter((p) => p.memberId === member.id).length > 0 && (
                                <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">
                                  {memberPackages.filter((p) => p.memberId === member.id).length}
                                </span>
                              )}
                            </button>
                            <button
                              className="text-blue-600 hover:text-blue-700 text-sm inline-flex items-center gap-1"
                              onClick={() => handleEditMember(member)}
                            >
                              <Edit2 className="w-4 h-4" />
                              编辑
                            </button>
                            <button
                              className="text-red-600 hover:text-red-700 text-sm inline-flex items-center gap-1"
                              onClick={() => handleDeleteMember(member)}
                            >
                              <Trash2 className="w-4 h-4" />
                              删除
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Tabs.Content>

          <Tabs.Content value="transactions">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">交易记录</h2>
              <div className="text-sm text-gray-500">
                共 {filteredTransactions.length} 条记录
              </div>
            </div>

            <div className="card p-4 mb-4">
              <div className="flex flex-wrap gap-3 items-end">
                <div>
                  <label className="label">选择会员</label>
                  <select
                    className="input min-w-[180px]"
                    value={txMemberFilter}
                    onChange={(e) => setTxMemberFilter((e.target as HTMLSelectElement).value)}
                  >
                    <option value="all">全部会员</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} - {m.phone}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">交易类型</label>
                  <select
                    className="input min-w-[140px]"
                    value={txTypeFilter}
                    onChange={(e) => setTxTypeFilter((e.target as HTMLSelectElement).value as TransactionType | 'all')}
                  >
                    <option value="all">全部类型</option>
                    {Object.entries(TRANSACTION_TYPE_LABEL).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">套餐抵扣</label>
                  <select
                    className="input min-w-[140px]"
                    value={txPackageFilter}
                    onChange={(e) => setTxPackageFilter((e.target as HTMLSelectElement).value as 'all' | 'has_package' | 'no_package')}
                  >
                    <option value="all">全部</option>
                    <option value="has_package">含套餐抵扣</option>
                    <option value="no_package">无套餐抵扣</option>
                  </select>
                </div>
                <div>
                  <label className="label">开始日期</label>
                  <input
                    type="date"
                    className="input min-w-[140px]"
                    value={txStartDate}
                    onInput={(e) => setTxStartDate((e.target as HTMLInputElement).value)}
                  />
                </div>
                <div>
                  <label className="label">结束日期</label>
                  <input
                    type="date"
                    className="input min-w-[140px]"
                    value={txEndDate}
                    onInput={(e) => setTxEndDate((e.target as HTMLInputElement).value)}
                    min={txStartDate}
                  />
                </div>
                <button className="btn-secondary" onClick={resetTxFilters}>
                  <X className="w-4 h-4" />
                  重置
                </button>
              </div>
            </div>

            <div className="card overflow-hidden">
              {filteredTransactions.length === 0 ? (
                <div className="p-12 text-center">
                  <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">暂无交易记录</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                        交易时间
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                        会员
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                        类型
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                        金额/课时
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                        余额变动
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                        备注
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredTransactions.map((tx) => {
                      const member = members.find((m) => m.id === tx.memberId);
                      return (
                        <tr key={tx.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {new Date(tx.createdAt).toLocaleString('zh-CN')}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="text-gray-900 font-medium">{member?.name || '未知会员'}</div>
                            <div className="text-gray-500 text-xs">{member?.phone || '-'}</div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-1.5">
                              {getTxIcon(tx.type)}
                              <span className={getTxColor(tx.type)}>
                                {TRANSACTION_TYPE_LABEL[tx.type]}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {tx.type === 'gift_hours' ? (
                              <span className={`font-semibold ${getTxColor(tx.type)}`}>
                                {getTxPrefix(tx.type)}{tx.hours} 小时
                              </span>
                            ) : (
                              <span className={`font-semibold ${getTxColor(tx.type)}`}>
                                {getTxPrefix(tx.type)}¥{tx.amount.toFixed(2)}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            ¥{tx.beforeBalance.toFixed(2)} → ¥{tx.afterBalance.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {tx.packageDeductions && tx.packageDeductions.length > 0 ? (
                              <div className="space-y-1">
                                {tx.packageDeductions.map((d, i) => (
                                  <div key={i} className="text-xs text-purple-600">
                                    🎟️ {d.packageName}：
                                    {d.deductedCount > 0 && <span>{d.deductedCount}次 </span>}
                                    {d.deductedHours > 0 && <span>{d.deductedHours}小时 </span>}
                                    (-¥{d.deductedAmount.toFixed(2)})
                                  </div>
                                ))}
                                {tx.balanceDeduction && tx.balanceDeduction > 0 && (
                                  <div className="text-xs text-amber-600">
                                    💰 余额补扣：¥{tx.balanceDeduction.toFixed(2)}
                                  </div>
                                )}
                                {tx.remark && <div className="text-xs text-gray-500 mt-1">{tx.remark}</div>}
                              </div>
                            ) : (
                              <span className="text-gray-500">{tx.remark || '-'}</span>
                            )}
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
        onRescheduleBooking={(booking) => {
          setDrawerOpen(false);
          handleRescheduleBooking(booking);
        }}
        onSettleBooking={handleSettleBooking}
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
          <button className="btn-danger" onClick={confirmDeleteCourt}>
            确认删除
          </button>
        </div>
      </Modal>

      <Modal
        open={showRescheduleForm}
        onClose={() => {
          setShowRescheduleForm(false);
          setReschedulingBooking(null);
        }}
        title="预订改期/改时"
      >
        {reschedulingBooking && (
          <RescheduleForm
            booking={reschedulingBooking}
            courts={courts}
            onSubmit={handleRescheduleSubmit}
            onCancel={() => {
              setShowRescheduleForm(false);
              setReschedulingBooking(null);
            }}
          />
        )}
      </Modal>

      <Modal
        open={showMemberForm}
        onClose={() => {
          setShowMemberForm(false);
          setEditingMember(null);
        }}
        title={editingMember ? '编辑会员' : '新增会员'}
      >
        <MemberForm
          member={editingMember || undefined}
          onSubmit={handleMemberSubmit}
          onCancel={() => {
            setShowMemberForm(false);
            setEditingMember(null);
          }}
        />
      </Modal>

      <Modal
        open={showMemberDeleteConfirm}
        onClose={() => {
          setShowMemberDeleteConfirm(false);
          setDeletingMember(null);
        }}
        title="确认删除会员"
      >
        <p className="text-sm text-gray-600 mb-6">
          确定要删除会员 <span className="font-medium text-gray-900">{deletingMember?.name}</span> 吗？
          此操作不可撤销。
        </p>
        <div className="flex justify-end gap-3">
          <button
            className="btn-secondary"
            onClick={() => {
              setShowMemberDeleteConfirm(false);
              setDeletingMember(null);
            }}
          >
            取消
          </button>
          <button className="btn-danger" onClick={confirmDeleteMember}>
            确认删除
          </button>
        </div>
      </Modal>

      <Modal
        open={showMemberTxForm && !!transactionMember}
        onClose={() => {
          setShowMemberTxForm(false);
          setTransactionMember(null);
        }}
        title="会员交易操作"
      >
        {transactionMember && (
          <MemberTransactionForm
            member={transactionMember}
            onSubmit={handleMemberTransactionSubmit}
            onCancel={() => {
              setShowMemberTxForm(false);
              setTransactionMember(null);
              refreshData();
            }}
          />
        )}
      </Modal>

      <MemberHistoryDrawer
        open={memberHistoryOpen}
        onClose={() => {
          setMemberHistoryOpen(false);
          setHistoryMember(null);
        }}
        member={historyMember}
        transactions={historyMemberTransactions}
        packages={historyMember ? getPackagesByMember(historyMember.id) : []}
        onViewPackages={() => {
          if (historyMember) {
            setMemberHistoryOpen(false);
            setHistoryMember(null);
            handleViewMemberPackages(historyMember);
          }
        }}
      />

      <Modal
        open={showPackageForm && !!packageFormMember}
        onClose={() => {
          setShowPackageForm(false);
          setPackageFormMember(null);
          setEditingPackage(null);
        }}
        title={editingPackage ? '编辑套餐' : '开通套餐'}
      >
        {packageFormMember && (
          <PackageForm
            memberId={packageFormMember.id}
            memberName={packageFormMember.name}
            existingPackage={editingPackage || undefined}
            onSubmit={(data) => {
              const result = handlePackageSubmit(data);
              if (result.success) {
                setShowPackageForm(false);
                setPackageFormMember(null);
                setEditingPackage(null);
              } else {
                alert(result.message || '保存失败');
              }
            }}
            onCancel={() => {
              setShowPackageForm(false);
              setPackageFormMember(null);
              setEditingPackage(null);
            }}
          />
        )}
      </Modal>

      <Modal
        open={showPackageDeleteConfirm}
        onClose={() => {
          setShowPackageDeleteConfirm(false);
          setDeletingPackage(null);
        }}
        title="确认删除套餐"
      >
        <p className="text-sm text-gray-600 mb-6">
          确定要删除套餐 <span className="font-medium text-gray-900">{deletingPackage?.name}</span> 吗？
          此操作不可撤销。
        </p>
        <div className="flex justify-end gap-3">
          <button
            className="btn-secondary"
            onClick={() => {
              setShowPackageDeleteConfirm(false);
              setDeletingPackage(null);
            }}
          >
            取消
          </button>
          <button className="btn-danger" onClick={confirmDeletePackage}>
            确认删除
          </button>
        </div>
      </Modal>

      <MemberPackageDrawer
        open={memberPackageOpen}
        onClose={() => {
          setMemberPackageOpen(false);
          setPackageMember(null);
        }}
        member={packageMember}
        packages={packageMember ? getPackagesByMember(packageMember.id) : []}
        onAddPackage={() => {
          if (packageMember) {
            handleAddPackage(packageMember);
          }
        }}
        onEditPackage={handleEditPackage}
        onDeletePackage={handleDeletePackage}
      />
    </div>
  );
}
