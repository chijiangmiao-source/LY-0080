import { useState, useMemo } from 'preact/hooks';
import type { Booking, Court } from '../types';
import { getTodayStr, isDateBeforeToday, isEndTimeBeforeStart } from '../lib/utils';
import { isTimeSlotConflict } from '../lib/storage';

interface BookingFormProps {
  courts: Court[];
  selectedCourtId?: string;
  onSubmit: (data: Omit<Booking, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

export function BookingForm({ courts, selectedCourtId, onSubmit, onCancel }: BookingFormProps) {
  const availableCourts = useMemo(
    () => courts.filter((c) => c.bookingStatus !== 'disabled'),
    [courts]
  );

  const getInitialCourtId = () => {
    if (selectedCourtId) {
      const selected = courts.find((c) => c.id === selectedCourtId);
      if (selected && selected.bookingStatus !== 'disabled') {
        return selectedCourtId;
      }
    }
    return availableCourts[0]?.id || '';
  };

  const [formData, setFormData] = useState({
    courtId: getInitialCourtId(),
    customerName: '',
    customerPhone: '',
    date: getTodayStr(),
    startTime: '09:00',
    endTime: '10:00',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.courtId) {
      newErrors.courtId = '请选择场地';
    } else {
      const selectedCourt = courts.find((c) => c.id === formData.courtId);
      if (selectedCourt?.bookingStatus === 'disabled') {
        newErrors.courtId = '该场地已停用，无法预订';
      }
    }
    if (!formData.customerName.trim()) {
      newErrors.customerName = '客户姓名不能为空';
    }
    if (!formData.customerPhone.trim()) {
      newErrors.customerPhone = '联系电话不能为空';
    }
    if (!formData.date) {
      newErrors.date = '请选择预订日期';
    } else if (isDateBeforeToday(formData.date)) {
      newErrors.date = '预订日期不能早于当前日期';
    }
    if (!formData.startTime) {
      newErrors.startTime = '请选择开始时间';
    }
    if (!formData.endTime) {
      newErrors.endTime = '请选择结束时间';
    } else if (formData.startTime && isEndTimeBeforeStart(formData.startTime, formData.endTime)) {
      newErrors.endTime = '结束时间不能早于开始时间';
    } else if (
      formData.courtId &&
      formData.date &&
      formData.startTime &&
      formData.endTime &&
      isTimeSlotConflict(formData.courtId, formData.date, formData.startTime, formData.endTime)
    ) {
      newErrors.endTime = '该时段已被预订，请选择其他时间';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({
        courtId: formData.courtId,
        customerName: formData.customerName.trim(),
        customerPhone: formData.customerPhone.trim(),
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        notes: formData.notes.trim() || undefined,
      });
    }
  };

  const update = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">选择场地 *</label>
        <select
          className="input"
          value={formData.courtId}
          onChange={(e) => update('courtId', (e.target as HTMLSelectElement).value)}
        >
          <option value="">请选择场地</option>
          {availableCourts.map((court) => (
            <option key={court.id} value={court.id}>
              {court.code} - {court.name}
            </option>
          ))}
        </select>
        {availableCourts.length === 0 && (
          <p className="text-yellow-600 text-xs mt-1">暂无可预订的场地</p>
        )}
        {errors.courtId && <p className="text-red-500 text-xs mt-1">{errors.courtId}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">客户姓名 *</label>
          <input
            type="text"
            className="input"
            value={formData.customerName}
            onInput={(e) => update('customerName', (e.target as HTMLInputElement).value)}
            placeholder="请输入客户姓名"
          />
          {errors.customerName && <p className="text-red-500 text-xs mt-1">{errors.customerName}</p>}
        </div>
        <div>
          <label className="label">联系电话 *</label>
          <input
            type="tel"
            className="input"
            value={formData.customerPhone}
            onInput={(e) => update('customerPhone', (e.target as HTMLInputElement).value)}
            placeholder="请输入联系电话"
          />
          {errors.customerPhone && <p className="text-red-500 text-xs mt-1">{errors.customerPhone}</p>}
        </div>
      </div>

      <div>
        <label className="label">预订日期 *</label>
        <input
          type="date"
          className="input"
          value={formData.date}
          min={getTodayStr()}
          onInput={(e) => update('date', (e.target as HTMLInputElement).value)}
        />
        {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">开始时间 *</label>
          <input
            type="time"
            className="input"
            value={formData.startTime}
            onInput={(e) => update('startTime', (e.target as HTMLInputElement).value)}
          />
          {errors.startTime && <p className="text-red-500 text-xs mt-1">{errors.startTime}</p>}
        </div>
        <div>
          <label className="label">结束时间 *</label>
          <input
            type="time"
            className="input"
            value={formData.endTime}
            onInput={(e) => update('endTime', (e.target as HTMLInputElement).value)}
          />
          {errors.endTime && <p className="text-red-500 text-xs mt-1">{errors.endTime}</p>}
        </div>
      </div>

      <div>
        <label className="label">备注</label>
        <textarea
          className="input min-h-[80px]"
          value={formData.notes}
          onInput={(e) => update('notes', (e.target as HTMLTextAreaElement).value)}
          placeholder="可选"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          取消
        </button>
        <button type="submit" className="btn-primary">
          确认预订
        </button>
      </div>
    </form>
  );
}
