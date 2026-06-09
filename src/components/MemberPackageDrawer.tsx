import { useState, useMemo } from 'preact/hooks';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Ticket, Clock, CalendarDays, Filter, Trash2, Edit2, Zap, AlertCircle, Banknote } from 'lucide-preact';
import type { Member, MemberPackage, PackageType, PackageStatus, CourtType } from '../types';
import { PACKAGE_TYPE_LABEL, PACKAGE_STATUS_LABEL, COURT_TYPE_LABEL, MEMBER_LEVEL_LABEL, MEMBER_STATUS_LABEL } from '../types';
import { formatDate } from '../lib/utils';
import { getPackageStatus, getTodayPackageConsumption, getTodayBalanceSupplement, getMemberExpiringPackages } from '../lib/storage';

interface MemberPackageDrawerProps {
  open: boolean;
  onClose: () => void;
  member: Member | null;
  packages: MemberPackage[];
  onAddPackage: () => void;
  onEditPackage: (pkg: MemberPackage) => void;
  onDeletePackage: (pkg: MemberPackage) => void;
}

export function MemberPackageDrawer({
  open,
  onClose,
  member,
  packages,
  onAddPackage,
  onEditPackage,
  onDeletePackage,
}: MemberPackageDrawerProps) {
  const [typeFilter, setTypeFilter] = useState<PackageType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<PackageStatus | 'all'>('all');
  const [validFromFilter, setValidFromFilter] = useState('');
  const [validToFilter, setValidToFilter] = useState('');

  const todayConsumption = useMemo(() => {
    if (!member) return { totalCount: 0, totalHours: 0, totalAmount: 0 };
    return getTodayPackageConsumption(member.id);
  }, [member, packages]);

  const todayBalanceSupplement = useMemo(() => {
    if (!member) return 0;
    return getTodayBalanceSupplement(member.id);
  }, [member, packages]);

  const expiringPackages = useMemo(() => {
    if (!member) return [];
    return getMemberExpiringPackages(member.id, 7);
  }, [member, packages]);

  const filteredPackages = useMemo(() => {
    return packages.filter((pkg) => {
      if (typeFilter !== 'all' && pkg.type !== typeFilter) return false;
      const status = getPackageStatus(pkg);
      if (statusFilter !== 'all' && status !== statusFilter) return false;
      if (validFromFilter && pkg.validFrom < validFromFilter) return false;
      if (validToFilter && pkg.validTo > validToFilter) return false;
      return true;
    });
  }, [packages, typeFilter, statusFilter, validFromFilter, validToFilter]);

  if (!member) return null;

  const getStatusBadgeClass = (status: PackageStatus) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'expired':
        return 'bg-gray-100 text-gray-600';
      case 'depleted':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getTypeIcon = (type: PackageType) => {
    switch (type) {
      case 'count':
        return <Ticket className="w-4 h-4" />;
      case 'hourly':
        return <Clock className="w-4 h-4" />;
      case 'time_slot':
        return <CalendarDays className="w-4 h-4" />;
    }
  };

  const getRemainingInfo = (pkg: MemberPackage) => {
    const remainingCount = pkg.totalCount - pkg.usedCount;
    const remainingHours = pkg.totalHours - pkg.usedHours;
    if (pkg.type === 'count') {
      return `剩余 ${remainingCount}/${pkg.totalCount} 次`;
    }
    if (pkg.type === 'hourly') {
      return `剩余 ${remainingHours.toFixed(1)}/${pkg.totalHours} 小时`;
    }
    return `剩余 ${remainingCount} 次 / ${remainingHours.toFixed(1)} 小时`;
  };

  const getProgressPercent = (pkg: MemberPackage) => {
    if (pkg.type === 'count' && pkg.totalCount > 0) {
      return (pkg.usedCount / pkg.totalCount) * 100;
    }
    if (pkg.type === 'hourly' && pkg.totalHours > 0) {
      return (pkg.usedHours / pkg.totalHours) * 100;
    }
    if (pkg.type === 'time_slot') {
      const countPct = pkg.totalCount > 0 ? (pkg.usedCount / pkg.totalCount) * 100 : 0;
      const hoursPct = pkg.totalHours > 0 ? (pkg.usedHours / pkg.totalHours) * 100 : 0;
      return Math.max(countPct, hoursPct);
    }
    return 0;
  };

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-0 right-0 w-full max-w-2xl h-full bg-white z-50 flex flex-col shadow-xl">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div>
              <Dialog.Title className="text-lg font-semibold text-gray-900">
                会员套餐管理
              </Dialog.Title>
              <p className="text-xs text-gray-500 mt-0.5">查看和管理会员的次卡、小时卡和时段套餐</p>
            </div>
            <Dialog.Close className="rounded-md p-1 hover:bg-gray-100">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{member.name}</h3>
                <p className="text-sm text-gray-500 mt-0.5">{member.phone}</p>
              </div>
              <div className="text-right">
                <p className="text-sm">
                  <span className={`badge ${
                    member.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : member.status === 'frozen'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {MEMBER_STATUS_LABEL[member.status]}
                  </span>
                </p>
                <p className="text-xs text-gray-500 mt-2">{MEMBER_LEVEL_LABEL[member.level]}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white p-3 rounded-md border border-gray-200">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                  <Zap className="w-3.5 h-3.5 text-emerald-600" />
                  今日套餐消耗
                </div>
                <div className="text-sm font-semibold text-gray-900">
                  {todayConsumption.totalCount > 0 && <span>{todayConsumption.totalCount} 次</span>}
                  {todayConsumption.totalCount > 0 && todayConsumption.totalHours > 0 && <span className="mx-1 text-gray-400">/</span>}
                  {todayConsumption.totalHours > 0 && <span>{todayConsumption.totalHours} 小时</span>}
                  {todayConsumption.totalCount === 0 && todayConsumption.totalHours === 0 && <span className="text-gray-400">暂无</span>}
                </div>
                {todayConsumption.totalAmount > 0 && (
                  <p className="text-xs text-emerald-600 mt-1">抵扣 ¥{todayConsumption.totalAmount.toFixed(2)}</p>
                )}
              </div>
              <div className="bg-white p-3 rounded-md border border-gray-200">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                  <Banknote className="w-3.5 h-3.5 text-orange-600" />
                  今日余额补扣
                </div>
                <div className="text-sm font-semibold text-orange-600">
                  ¥{todayBalanceSupplement.toFixed(2)}
                </div>
                <p className="text-xs text-gray-400 mt-1">套餐不足后从余额扣除</p>
              </div>
              <div className="bg-white p-3 rounded-md border border-gray-200">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  即将到期
                </div>
                <div className="text-sm font-semibold text-amber-600">
                  {expiringPackages.length} 个
                </div>
                <p className="text-xs text-gray-400 mt-1">7天内到期</p>
              </div>
            </div>
          </div>

          <div className="p-4 border-b border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Filter className="w-4 h-4" />
                筛选套餐（共 {filteredPackages.length} 个）
              </div>
              <button className="btn-primary text-sm py-1.5" onClick={onAddPackage}>
                <Ticket className="w-4 h-4" />
                开通套餐
              </button>
            </div>
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="label text-xs">套餐类型</label>
                <select
                  className="input text-sm py-1.5 min-w-[120px]"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter((e.target as HTMLSelectElement).value as PackageType | 'all')}
                >
                  <option value="all">全部类型</option>
                  {Object.entries(PACKAGE_TYPE_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label text-xs">消耗状态</label>
                <select
                  className="input text-sm py-1.5 min-w-[120px]"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter((e.target as HTMLSelectElement).value as PackageStatus | 'all')}
                >
                  <option value="all">全部状态</option>
                  {Object.entries(PACKAGE_STATUS_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label text-xs">生效日期起</label>
                <input
                  type="date"
                  className="input text-sm py-1.5"
                  value={validFromFilter}
                  onInput={(e) => setValidFromFilter((e.target as HTMLInputElement).value)}
                />
              </div>
              <div>
                <label className="label text-xs">到期日期止</label>
                <input
                  type="date"
                  className="input text-sm py-1.5"
                  value={validToFilter}
                  onInput={(e) => setValidToFilter((e.target as HTMLInputElement).value)}
                />
              </div>
              <button
                className="btn-secondary text-sm py-1.5"
                onClick={() => {
                  setTypeFilter('all');
                  setStatusFilter('all');
                  setValidFromFilter('');
                  setValidToFilter('');
                }}
              >
                重置
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {filteredPackages.length === 0 ? (
              <div className="text-center py-12">
                <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">暂无符合条件的套餐</p>
                <button className="btn-primary mt-4 text-sm" onClick={onAddPackage}>
                  开通第一个套餐
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPackages.map((pkg) => {
                  const status = getPackageStatus(pkg);
                  const progress = getProgressPercent(pkg);
                  return (
                    <div
                      key={pkg.id}
                      className={`border rounded-lg p-4 ${
                        status === 'active' ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200 opacity-75'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-2">
                          <div className={`p-1.5 rounded-md ${
                            pkg.type === 'count' ? 'bg-purple-100 text-purple-600' :
                            pkg.type === 'hourly' ? 'bg-blue-100 text-blue-600' :
                            'bg-teal-100 text-teal-600'
                          }`}>
                            {getTypeIcon(pkg.type)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-gray-900">{pkg.name}</h4>
                              <span className={`badge ${getStatusBadgeClass(status)}`}>
                                {PACKAGE_STATUS_LABEL[status]}
                              </span>
                              <span className="badge bg-gray-100 text-gray-600">
                                {PACKAGE_TYPE_LABEL[pkg.type]}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{getRemainingInfo(pkg)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {status === 'active' && (
                            <button
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                              onClick={() => onEditPackage(pkg)}
                              title="编辑套餐"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                            onClick={() => onDeletePackage(pkg)}
                            title="删除套餐"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>使用进度</span>
                          <span>{progress.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              progress >= 90 ? 'bg-red-500' : progress >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-gray-500">有效期：</span>
                          <span className="text-gray-700">
                            {formatDate(pkg.validFrom)} ~ {formatDate(pkg.validTo)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">适用场地：</span>
                          <span className="text-gray-700">
                            {pkg.applicableCourtTypes.length === 0
                              ? '全部场地'
                              : pkg.applicableCourtTypes.map((t: CourtType) => COURT_TYPE_LABEL[t]).join('、')}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-500">适用时段：</span>
                          <span className="text-gray-700">
                            {pkg.applicableTimeSlots.length === 0
                              ? '全天可用'
                              : pkg.applicableTimeSlots.join('、')}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
