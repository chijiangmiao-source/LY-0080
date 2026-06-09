import { useState, useMemo } from 'preact/hooks';
import type { Member, TransactionType } from '../types';
import { TRANSACTION_TYPE_LABEL } from '../types';

interface MemberTransactionFormProps {
  member: Member;
  onSubmit: (data: {
    type: TransactionType;
    amount: number;
    hours: number;
    remark?: string;
  }) => { success: boolean; message?: string };
  onCancel: () => void;
}

export function MemberTransactionForm({ member, onSubmit, onCancel }: MemberTransactionFormProps) {
  const transactionTypes: TransactionType[] = useMemo(
    () => ['recharge', 'deduct', 'refund', 'gift_hours'],
    []
  );

  const [formData, setFormData] = useState({
    type: 'recharge' as TransactionType,
    amount: '',
    hours: '',
    remark: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isHoursType = formData.type === 'gift_hours';
  const isAmountType = !isHoursType;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (isAmountType) {
      const amount = parseFloat(formData.amount);
      if (!formData.amount || isNaN(amount)) {
        newErrors.amount = '请输入有效金额';
      } else if (amount <= 0) {
        newErrors.amount = '金额必须大于0';
      } else if ((formData.type === 'deduct') && amount > member.balance) {
        newErrors.amount = '扣费金额不能超过会员余额';
      }
    } else {
      const hours = parseFloat(formData.hours);
      if (!formData.hours || isNaN(hours)) {
        newErrors.hours = '请输入有效课时数';
      } else if (hours <= 0) {
        newErrors.hours = '课时数必须大于0';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    setMessage(null);
    if (validate()) {
      const result = onSubmit({
        type: formData.type,
        amount: isAmountType ? parseFloat(formData.amount) : 0,
        hours: isHoursType ? parseFloat(formData.hours) : 0,
        remark: formData.remark.trim() || undefined,
      });
      if (result.success) {
        setMessage({ type: 'success', text: '操作成功！' });
        setFormData({ type: 'recharge', amount: '', hours: '', remark: '' });
      } else {
        setMessage({ type: 'error', text: result.message || '操作失败' });
      }
    }
  };

  const update = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setMessage(null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-3 bg-gray-50 rounded-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900">{member.name}</p>
            <p className="text-xs text-gray-500">{member.phone}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">
              余额：<span className="font-semibold text-emerald-600">¥{member.balance.toFixed(2)}</span>
            </p>
            <p className="text-sm text-gray-500">
              赠送课时：<span className="font-semibold text-blue-600">{member.giftHours} 小时</span>
            </p>
          </div>
        </div>
      </div>

      <div>
        <label className="label">交易类型 *</label>
        <select
          className="input"
          value={formData.type}
          onChange={(e) => update('type', (e.target as HTMLSelectElement).value)}
        >
          {transactionTypes.map((type) => (
            <option key={type} value={type}>
              {TRANSACTION_TYPE_LABEL[type]}
            </option>
          ))}
        </select>
      </div>

      {isAmountType ? (
        <div>
          <label className="label">
            金额（元） *
            {formData.type === 'deduct' && (
              <span className="text-gray-400 ml-2">最多可扣 ¥{member.balance.toFixed(2)}</span>
            )}
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="input"
            value={formData.amount}
            onInput={(e) => update('amount', (e.target as HTMLInputElement).value)}
            placeholder={
              formData.type === 'recharge'
                ? '请输入储值金额'
                : formData.type === 'refund'
                ? '请输入退款金额'
                : '请输入扣费金额'
            }
          />
          {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
        </div>
      ) : (
        <div>
          <label className="label">课时数（小时） *</label>
          <input
            type="number"
            step="0.5"
            min="0"
            className="input"
            value={formData.hours}
            onInput={(e) => update('hours', (e.target as HTMLInputElement).value)}
            placeholder="请输入赠送课时数"
          />
          {errors.hours && <p className="text-red-500 text-xs mt-1">{errors.hours}</p>}
        </div>
      )}

      <div>
        <label className="label">备注</label>
        <textarea
          className="input min-h-[60px]"
          value={formData.remark}
          onInput={(e) => update('remark', (e.target as HTMLTextAreaElement).value)}
          placeholder="可选"
        />
      </div>

      {message && (
        <div
          className={`p-3 rounded-md text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          关闭
        </button>
        <button type="submit" className="btn-primary">
          确认操作
        </button>
      </div>
    </form>
  );
}
