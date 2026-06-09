import { useState } from 'preact/hooks';
import type { MemberPackage, PackageType, CourtType } from '../types';
import { PACKAGE_TYPE_LABEL, COURT_TYPE_LABEL } from '../types';
import { getTodayStr } from '../lib/utils';

interface PackageFormProps {
  memberId?: string;
  memberName: string;
  existingPackage?: MemberPackage;
  onSubmit: (data: {
    name: string;
    type: PackageType;
    totalCount: number;
    totalHours: number;
    applicableCourtTypes: CourtType[];
    applicableTimeSlots: string[];
    validFrom: string;
    validTo: string;
  }) => void;
  onCancel: () => void;
}

const PRESET_TIME_SLOTS = [
  '06:00-10:00',
  '10:00-14:00',
  '14:00-18:00',
  '18:00-22:00',
  '09:00-12:00',
  '14:00-17:00',
  '19:00-22:00',
];

export function PackageForm({ memberName, existingPackage, onSubmit, onCancel }: PackageFormProps) {
  const today = getTodayStr();
  const defaultValidTo = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  })();

  const [formData, setFormData] = useState({
    name: existingPackage?.name || '',
    type: (existingPackage?.type as PackageType) || 'count',
    totalCount: existingPackage?.totalCount || 10,
    totalHours: existingPackage?.totalHours || 10,
    applicableCourtTypes: existingPackage?.applicableCourtTypes || ([] as CourtType[]),
    applicableTimeSlots: existingPackage?.applicableTimeSlots || ([] as string[]),
    customTimeSlot: '',
    validFrom: existingPackage?.validFrom || today,
    validTo: existingPackage?.validTo || defaultValidTo,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const courtTypes: CourtType[] = ['standard', 'vip', 'training', 'competition'];

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = '套餐名称不能为空';
    }
    if (formData.type === 'count' && formData.totalCount <= 0) {
      newErrors.totalCount = '次数必须大于0';
    }
    if (formData.type === 'hourly' && formData.totalHours <= 0) {
      newErrors.totalHours = '时长必须大于0';
    }
    if (formData.type === 'time_slot' && formData.totalCount <= 0 && formData.totalHours <= 0) {
      newErrors.totalCount = '次数或时长至少一个大于0';
    }
    if (!formData.validFrom) {
      newErrors.validFrom = '请选择生效日期';
    }
    if (!formData.validTo) {
      newErrors.validTo = '请选择到期日期';
    } else if (formData.validFrom && formData.validTo < formData.validFrom) {
      newErrors.validTo = '到期日期不能早于生效日期';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({
        name: formData.name.trim(),
        type: formData.type,
        totalCount: formData.type === 'hourly' ? 0 : formData.totalCount,
        totalHours: formData.type === 'count' ? 0 : formData.totalHours,
        applicableCourtTypes: formData.applicableCourtTypes,
        applicableTimeSlots: formData.applicableTimeSlots,
        validFrom: formData.validFrom,
        validTo: formData.validTo,
      });
    }
  };

  const update = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const toggleCourtType = (type: CourtType) => {
    setFormData((prev) => {
      const exists = prev.applicableCourtTypes.includes(type);
      return {
        ...prev,
        applicableCourtTypes: exists
          ? prev.applicableCourtTypes.filter((t) => t !== type)
          : [...prev.applicableCourtTypes, type],
      };
    });
  };

  const toggleTimeSlot = (slot: string) => {
    setFormData((prev) => {
      const exists = prev.applicableTimeSlots.includes(slot);
      return {
        ...prev,
        applicableTimeSlots: exists
          ? prev.applicableTimeSlots.filter((s) => s !== slot)
          : [...prev.applicableTimeSlots, slot],
      };
    });
  };

  const addCustomTimeSlot = () => {
    const slot = formData.customTimeSlot.trim();
    if (!slot) return;
    const regex = /^\d{2}:\d{2}-\d{2}:\d{2}$/;
    if (!regex.test(slot)) {
      setErrors((prev) => ({ ...prev, customTimeSlot: '格式应为 HH:MM-HH:MM' }));
      return;
    }
    const [start, end] = slot.split('-');
    if (start >= end) {
      setErrors((prev) => ({ ...prev, customTimeSlot: '结束时间必须大于开始时间' }));
      return;
    }
    if (!formData.applicableTimeSlots.includes(slot)) {
      setFormData((prev) => ({
        ...prev,
        applicableTimeSlots: [...prev.applicableTimeSlots, slot],
        customTimeSlot: '',
      }));
    }
    setErrors((prev) => {
      const next = { ...prev };
      delete next.customTimeSlot;
      return next;
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-md">
        <p className="text-sm text-emerald-700">
          为会员 <span className="font-semibold">{memberName}</span> {existingPackage ? '编辑套餐' : '开通新套餐'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="label">套餐名称 *</label>
          <input
            type="text"
            className="input"
            value={formData.name}
            onInput={(e) => update('name', (e.target as HTMLInputElement).value)}
            placeholder="如：标准场10次卡、黄金时段20小时卡"
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>

        <div className="col-span-2">
          <label className="label">套餐类型 *</label>
          <select
            className="input"
            value={formData.type}
            onChange={(e) => update('type', (e.target as HTMLSelectElement).value)}
          >
            {Object.entries(PACKAGE_TYPE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {formData.type === 'count' && '按次使用，每次预订抵扣1次'}
            {formData.type === 'hourly' && '按时长使用，按预订小时数抵扣'}
            {formData.type === 'time_slot' && '限定时段内使用，可同时配置次数和时长'}
          </p>
        </div>

        {formData.type !== 'hourly' && (
          <div>
            <label className="label">总次数 *</label>
            <input
              type="number"
              className="input"
              min={0}
              value={formData.totalCount}
              onInput={(e) => update('totalCount', Number((e.target as HTMLInputElement).value))}
            />
            {errors.totalCount && <p className="text-red-500 text-xs mt-1">{errors.totalCount}</p>}
          </div>
        )}

        {formData.type !== 'count' && (
          <div>
            <label className="label">总时长（小时）*</label>
            <input
              type="number"
              className="input"
              min={0}
              step={0.5}
              value={formData.totalHours}
              onInput={(e) => update('totalHours', Number((e.target as HTMLInputElement).value))}
            />
            {errors.totalHours && <p className="text-red-500 text-xs mt-1">{errors.totalHours}</p>}
          </div>
        )}
      </div>

      <div>
        <label className="label">适用场地类型（留空表示全部适用）</label>
        <div className="flex flex-wrap gap-2">
          {courtTypes.map((type) => (
            <label
              key={type}
              className={`px-3 py-1.5 border rounded-md cursor-pointer text-sm transition ${
                formData.applicableCourtTypes.includes(type)
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={formData.applicableCourtTypes.includes(type)}
                onChange={() => toggleCourtType(type)}
              />
              {COURT_TYPE_LABEL[type]}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="label">适用时段（留空表示全天适用）</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {PRESET_TIME_SLOTS.map((slot) => (
            <label
              key={slot}
              className={`px-3 py-1.5 border rounded-md cursor-pointer text-sm transition ${
                formData.applicableTimeSlots.includes(slot)
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={formData.applicableTimeSlots.includes(slot)}
                onChange={() => toggleTimeSlot(slot)}
              />
              {slot}
            </label>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            className="input flex-1"
            placeholder="自定义时段，如 08:00-10:00"
            value={formData.customTimeSlot}
            onInput={(e) => update('customTimeSlot', (e.target as HTMLInputElement).value)}
          />
          <button type="button" className="btn-secondary" onClick={addCustomTimeSlot}>
            添加
          </button>
        </div>
        {errors.customTimeSlot && <p className="text-red-500 text-xs mt-1">{errors.customTimeSlot}</p>}
        {formData.applicableTimeSlots.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {formData.applicableTimeSlots.map((slot) => (
              <span key={slot} className="badge bg-blue-100 text-blue-700 inline-flex items-center gap-1">
                {slot}
                <button
                  type="button"
                  onClick={() => toggleTimeSlot(slot)}
                  className="hover:text-blue-900"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">生效日期 *</label>
          <input
            type="date"
            className="input"
            value={formData.validFrom}
            onInput={(e) => update('validFrom', (e.target as HTMLInputElement).value)}
          />
          {errors.validFrom && <p className="text-red-500 text-xs mt-1">{errors.validFrom}</p>}
        </div>
        <div>
          <label className="label">到期日期 *</label>
          <input
            type="date"
            className="input"
            value={formData.validTo}
            min={formData.validFrom}
            onInput={(e) => update('validTo', (e.target as HTMLInputElement).value)}
          />
          {errors.validTo && <p className="text-red-500 text-xs mt-1">{errors.validTo}</p>}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          取消
        </button>
        <button type="submit" className="btn-primary">
          {existingPackage ? '保存修改' : '确认开通'}
        </button>
      </div>
    </form>
  );
}
