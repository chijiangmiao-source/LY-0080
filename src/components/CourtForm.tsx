import { useState } from 'preact/hooks';
import type { Court, CourtType, BookingStatus, EquipmentStatus } from '../types';
import {
  COURT_TYPE_LABEL,
  BOOKING_STATUS_LABEL,
  EQUIPMENT_STATUS_LABEL,
} from '../types';
import { isCourtCodeDuplicate } from '../lib/storage';

interface CourtFormProps {
  court?: Court;
  onSubmit: (data: Omit<Court, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

export function CourtForm({ court, onSubmit, onCancel }: CourtFormProps) {
  const [formData, setFormData] = useState({
    code: court?.code || '',
    name: court?.name || '',
    type: (court?.type || 'standard') as CourtType,
    zone: court?.zone || '',
    bookingStatus: (court?.bookingStatus || 'idle') as BookingStatus,
    lightingStatus: (court?.lightingStatus || 'normal') as EquipmentStatus,
    floorStatus: (court?.floorStatus || 'normal') as EquipmentStatus,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.code.trim()) {
      newErrors.code = '场地编号不能为空';
    } else if (isCourtCodeDuplicate(formData.code.trim(), court?.id)) {
      newErrors.code = '场地编号已存在';
    }
    if (!formData.name.trim()) {
      newErrors.name = '场地名称不能为空';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({
        code: formData.code.trim(),
        name: formData.name.trim(),
        type: formData.type,
        zone: formData.zone.trim(),
        bookingStatus: formData.bookingStatus,
        lightingStatus: formData.lightingStatus,
        floorStatus: formData.floorStatus,
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
          <label className="label">场地编号 *</label>
          <input
            type="text"
            className="input"
            value={formData.code}
            onInput={(e) => update('code', (e.target as HTMLInputElement).value)}
            placeholder="例如：C001"
          />
          {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code}</p>}
        </div>
        <div>
          <label className="label">场地名称 *</label>
          <input
            type="text"
            className="input"
            value={formData.name}
            onInput={(e) => update('name', (e.target as HTMLInputElement).value)}
            placeholder="例如：1号场地"
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">场地类型</label>
          <select
            className="input"
            value={formData.type}
            onChange={(e) => update('type', (e.target as HTMLSelectElement).value)}
          >
            {Object.entries(COURT_TYPE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">所在区域</label>
          <input
            type="text"
            className="input"
            value={formData.zone}
            onInput={(e) => update('zone', (e.target as HTMLInputElement).value)}
            placeholder="例如：A区"
          />
        </div>
      </div>

      <div>
        <label className="label">预订状态</label>
        <select
          className="input"
          value={formData.bookingStatus}
          onChange={(e) => update('bookingStatus', (e.target as HTMLSelectElement).value)}
        >
          {Object.entries(BOOKING_STATUS_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">照明状态</label>
          <select
            className="input"
            value={formData.lightingStatus}
            onChange={(e) => update('lightingStatus', (e.target as HTMLSelectElement).value)}
          >
            {Object.entries(EQUIPMENT_STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">地胶状态</label>
          <select
            className="input"
            value={formData.floorStatus}
            onChange={(e) => update('floorStatus', (e.target as HTMLSelectElement).value)}
          >
            {Object.entries(EQUIPMENT_STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          取消
        </button>
        <button type="submit" className="btn-primary">
          {court ? '保存修改' : '新增场地'}
        </button>
      </div>
    </form>
  );
}
