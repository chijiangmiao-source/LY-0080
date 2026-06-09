import { useState } from 'preact/hooks';
import type { Member, MemberLevel, MemberStatus } from '../types';
import { MEMBER_LEVEL_LABEL, MEMBER_STATUS_LABEL } from '../types';
import { getTodayStr } from '../lib/utils';
import { isMemberPhoneDuplicate } from '../lib/storage';

interface MemberFormProps {
  member?: Member;
  onSubmit: (data: Omit<Member, 'id' | 'balance' | 'giftHours'>) => void;
  onCancel: () => void;
}

export function MemberForm({ member, onSubmit, onCancel }: MemberFormProps) {
  const [formData, setFormData] = useState({
    name: member?.name || '',
    phone: member?.phone || '',
    level: (member?.level as MemberLevel) || 'normal',
    createdAt: member?.createdAt ? member.createdAt.split('T')[0] : getTodayStr(),
    status: (member?.status as MemberStatus) || 'active',
    note: member?.note || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = '姓名不能为空';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = '手机号不能为空';
    } else if (!/^1[3-9]\d{9}$/.test(formData.phone.trim())) {
      newErrors.phone = '请输入正确的11位手机号';
    } else if (isMemberPhoneDuplicate(formData.phone.trim(), member?.id)) {
      newErrors.phone = '该手机号已被其他会员使用';
    }
    if (!formData.createdAt) {
      newErrors.createdAt = '请选择开卡日期';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        level: formData.level,
        createdAt: new Date(formData.createdAt).toISOString(),
        status: formData.status,
        note: formData.note.trim() || undefined,
      });
    }
  };

  const update = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">姓名 *</label>
          <input
            type="text"
            className="input"
            value={formData.name}
            onInput={(e) => update('name', (e.target as HTMLInputElement).value)}
            placeholder="请输入会员姓名"
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>
        <div>
          <label className="label">手机号 *</label>
          <input
            type="tel"
            className="input"
            value={formData.phone}
            onInput={(e) => update('phone', (e.target as HTMLInputElement).value)}
            placeholder="请输入手机号"
          />
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">会员等级</label>
          <select
            className="input"
            value={formData.level}
            onChange={(e) => update('level', (e.target as HTMLSelectElement).value)}
          >
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
            className="input"
            value={formData.status}
            onChange={(e) => update('status', (e.target as HTMLSelectElement).value)}
          >
            {Object.entries(MEMBER_STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label">开卡日期 *</label>
        <input
          type="date"
          className="input"
          value={formData.createdAt}
          onInput={(e) => update('createdAt', (e.target as HTMLInputElement).value)}
        />
        {errors.createdAt && <p className="text-red-500 text-xs mt-1">{errors.createdAt}</p>}
      </div>

      {member && (
        <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-md">
          <div>
            <p className="text-xs text-gray-500">可用余额</p>
            <p className="text-lg font-semibold text-gray-900">¥{member.balance.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">赠送课时</p>
            <p className="text-lg font-semibold text-gray-900">{member.giftHours} 小时</p>
          </div>
        </div>
      )}

      <div>
        <label className="label">备注</label>
        <textarea
          className="input min-h-[60px]"
          value={formData.note}
          onInput={(e) => update('note', (e.target as HTMLTextAreaElement).value)}
          placeholder="可选"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          取消
        </button>
        <button type="submit" className="btn-primary">
          {member ? '保存修改' : '创建会员'}
        </button>
      </div>
    </form>
  );
}
