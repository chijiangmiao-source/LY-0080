import * as Dialog from '@radix-ui/react-dialog';
import { X, ArrowUpCircle, ArrowDownCircle, Gift, CreditCard } from 'lucide-preact';
import type { Member, MemberTransaction } from '../types';
import { TRANSACTION_TYPE_LABEL, MEMBER_LEVEL_LABEL, MEMBER_STATUS_LABEL } from '../types';
import { formatDate } from '../lib/utils';

interface MemberHistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  member: Member | null;
  transactions: MemberTransaction[];
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

export function MemberHistoryDrawer({ open, onClose, member, transactions }: MemberHistoryDrawerProps) {
  if (!member) return null;

  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

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
