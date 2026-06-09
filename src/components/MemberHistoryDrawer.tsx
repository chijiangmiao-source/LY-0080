import { useMemo } from 'preact/hooks';
import * as Dialog from '@radix-ui/react-dialog';
import { X, ArrowUpCircle, ArrowDownCircle, Gift, CreditCard, Ticket, Zap, Banknote, AlertCircle } from 'lucide-preact';
import type { Member, MemberTransaction, MemberPackage } from '../types';
import { TRANSACTION_TYPE_LABEL, MEMBER_LEVEL_LABEL, MEMBER_STATUS_LABEL } from '../types';
import { formatDate } from '../lib/utils';
import { getTodayPackageConsumption, getTodayBalanceSupplement, getMemberExpiringPackages, getPackageStatus } from '../lib/storage';

interface MemberHistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  member: Member | null;
  transactions: MemberTransaction[];
  packages?: MemberPackage[];
  onViewPackages?: () => void;
}

const getTransactionIcon = (type: string) => {
  switch (type) {
    case 'recharge':
    case 'refund':
    case 'gift_amount':
      return <ArrowUpCircle className="w-5 h-5 text-emerald-600" />;
    case 'deduct':
    case 'consume':
      return <ArrowDownCircle className="w-5 h-5 text-red-600" />;
    case 'gift_hours':
      return <Gift className="w-5 h-5 text-blue-600" />;
    default:
      return <CreditCard className="w-5 h-5 text-gray-600" />;
  }
};

const getTypeColorClass = (type: string) => {
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
    default:
      return 'text-gray-600';
  }
};

const getAmountPrefix = (type: string) => {
  switch (type) {
    case 'recharge':
    case 'refund':
    case 'gift_amount':
    case 'gift_hours':
      return '+';
    case 'deduct':
    case 'consume':
      return '-';
    default:
      return '';
  }
};

export function MemberHistoryDrawer({ open, onClose, member, transactions, packages, onViewPackages }: MemberHistoryDrawerProps) {
  if (!member) return null;

  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const todayConsumption = useMemo(() => {
    return getTodayPackageConsumption(member.id);
  }, [member, transactions]);

  const todayBalanceSupplement = useMemo(() => {
    return getTodayBalanceSupplement(member.id);
  }, [member, transactions]);

  const expiringPackages = useMemo(() => {
    return getMemberExpiringPackages(member.id, 7);
  }, [member, packages]);

  const activePackages = useMemo(() => {
    if (!packages) return [];
    return packages.filter((p) => getPackageStatus(p) === 'active');
  }, [packages]);

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-0 right-0 w-full max-w-xl h-full bg-white z-50 flex flex-col shadow-xl">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div>
              <Dialog.Title className="text-lg font-semibold text-gray-900">
                会员详情 - 交易记录
              </Dialog.Title>
              <p className="text-xs text-gray-500 mt-0.5">查看会员信息及交易明细</p>
            </div>
            <Dialog.Close className="rounded-md p-1 hover:bg-gray-100">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-start justify-between">
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
                <p className="text-xs text-gray-500 mt-2">
                  {MEMBER_LEVEL_LABEL[member.level]}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-white p-3 rounded-md border border-gray-200">
                <p className="text-xs text-gray-500">可用余额</p>
                <p className="text-xl font-bold text-emerald-600 mt-1">
                  ¥{member.balance.toFixed(2)}
                </p>
              </div>
              <div className="bg-white p-3 rounded-md border border-gray-200">
                <p className="text-xs text-gray-500">赠送课时</p>
                <p className="text-xl font-bold text-blue-600 mt-1">
                  {member.giftHours} 小时
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-3">
              <div className="bg-white p-2.5 rounded-md border border-gray-200">
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Zap className="w-3 h-3 text-emerald-600" />
                  今日套餐消耗
                </div>
                <div className="text-sm font-semibold text-gray-900 mt-0.5">
                  {todayConsumption.totalCount > 0 && <span>{todayConsumption.totalCount}次</span>}
                  {todayConsumption.totalCount > 0 && todayConsumption.totalHours > 0 && <span className="text-gray-400 mx-1">/</span>}
                  {todayConsumption.totalHours > 0 && <span>{todayConsumption.totalHours}h</span>}
                  {todayConsumption.totalCount === 0 && todayConsumption.totalHours === 0 && <span className="text-gray-400">-</span>}
                </div>
              </div>
              <div className="bg-white p-2.5 rounded-md border border-gray-200">
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Banknote className="w-3 h-3 text-orange-600" />
                  今日余额补扣
                </div>
                <div className="text-sm font-semibold text-orange-600 mt-0.5">
                  ¥{todayBalanceSupplement.toFixed(2)}
                </div>
              </div>
              <div className="bg-white p-2.5 rounded-md border border-gray-200">
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <AlertCircle className="w-3 h-3 text-amber-600" />
                  即将到期
                </div>
                <div className="text-sm font-semibold text-amber-600 mt-0.5">
                  {expiringPackages.length} 个
                </div>
              </div>
            </div>

            {activePackages.length > 0 && onViewPackages && (
              <button
                onClick={onViewPackages}
                className="mt-3 w-full flex items-center justify-center gap-2 py-2 bg-white border border-purple-200 rounded-md text-sm text-purple-700 hover:bg-purple-50"
              >
                <Ticket className="w-4 h-4" />
                查看 {activePackages.length} 个有效套餐
              </button>
            )}

            <div className="mt-3 text-xs text-gray-500">
              开卡日期：{formatDate(member.createdAt)}
              {member.note && <span className="ml-3">备注：{member.note}</span>}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">交易明细</h4>
            {sortedTransactions.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">暂无交易记录</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sortedTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-md"
                  >
                    <div className="flex-shrink-0 mt-0.5">{getTransactionIcon(tx.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900 text-sm">
                          {TRANSACTION_TYPE_LABEL[tx.type]}
                        </p>
                        {tx.type === 'gift_hours' ? (
                          <p className={`text-sm font-semibold ${getTypeColorClass(tx.type)}`}>
                            {getAmountPrefix(tx.type)}{tx.hours} 小时
                          </p>
                        ) : (
                          <p className={`text-sm font-semibold ${getTypeColorClass(tx.type)}`}>
                            {getAmountPrefix(tx.type)}¥{tx.amount.toFixed(2)}
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(tx.createdAt).toLocaleString('zh-CN')}
                      </p>
                      {tx.remark && (
                        <p className="text-xs text-gray-500 mt-1">备注：{tx.remark}</p>
                      )}
                      {tx.packageDeductions && tx.packageDeductions.length > 0 && (
                        <div className="mt-1.5 p-2 bg-purple-50 rounded-md border border-purple-100">
                          <p className="text-xs font-medium text-purple-700 mb-1">套餐抵扣明细：</p>
                          <div className="space-y-0.5">
                            {tx.packageDeductions.map((d, idx) => (
                              <div key={idx} className="flex justify-between text-xs text-gray-600">
                                <span>
                                  <Ticket className="w-3 h-3 inline mr-0.5 text-purple-500" />
                                  {d.packageName}
                                  {d.deductedCount > 0 && <span className="ml-1">-{d.deductedCount}次</span>}
                                  {d.deductedHours > 0 && <span className="ml-1">-{d.deductedHours}h</span>}
                                </span>
                                <span className="text-emerald-600 font-medium">-¥{d.deductedAmount.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                          {tx.balanceDeduction && tx.balanceDeduction > 0 && (
                            <div className="flex justify-between text-xs text-gray-600 mt-1 pt-1 border-t border-purple-200">
                              <span>
                                <CreditCard className="w-3 h-3 inline mr-0.5 text-orange-500" />
                                储值余额补扣
                              </span>
                              <span className="text-orange-600 font-medium">-¥{tx.balanceDeduction.toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        余额变动：¥{tx.beforeBalance.toFixed(2)} → ¥{tx.afterBalance.toFixed(2)}
                        {tx.type === 'gift_hours' && (
                          <span className="ml-2">
                            课时：{tx.beforeHours} → {tx.afterHours}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
